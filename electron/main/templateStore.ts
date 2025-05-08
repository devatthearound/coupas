// electron/main/templateStore.ts

import pool from "@/app/lib/db";

// 템플릿 타입 정의
export interface VideoTemplate {
  id?: number;
  user_id: number;
  template_name: string;
  description?: string;
  intro_video_path?: string;
  outro_video_path?: string;
  background_music_path?: string;
  output_directory?: string;
  image_display_duration: number;
  is_default: boolean;
  is_active: boolean;
  last_used_at?: Date;
}

// 템플릿 저장소 클래스
export class TemplateStore {
  /**
   * 사용자의 템플릿 목록 조회
   * @param userId 사용자 ID
   * @returns 템플릿 목록
   */
  static async getTemplates(userId: number): Promise<VideoTemplate[]> {
    try {
      const query = `
        SELECT * FROM video_templates
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_used_at DESC NULLS LAST, created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 개별 템플릿 조회
   * @param templateId 템플릿 ID
   * @param userId 사용자 ID
   * @returns 템플릿 정보
   */
  static async getTemplate(templateId: number, userId: number): Promise<VideoTemplate | null> {
    try {
      const query = `
        SELECT * FROM video_templates
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `;
      const result = await pool.query(query, [templateId, userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자의 기본 템플릿 조회
   * @param userId 사용자 ID
   * @returns 기본 템플릿 정보
   */
  static async getDefaultTemplate(userId: number): Promise<VideoTemplate | null> {
    try {
      const query = `
        SELECT * FROM video_templates
        WHERE user_id = $1 AND is_default = true AND is_active = true
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자의 마지막 사용 템플릿 조회
   * @param userId 사용자 ID
   * @returns 마지막 사용 템플릿 정보
   */
  static async getLastUsedTemplate(userId: number): Promise<VideoTemplate | null> {
    try {
      const query = `
        SELECT * FROM video_templates
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_used_at DESC NULLS LAST
        LIMIT 1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 템플릿 생성
   * @param template 템플릿 정보
   * @returns 생성된 템플릿 ID
   */
  static async createTemplate(template: VideoTemplate): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 새 템플릿이 기본 템플릿인 경우 기존 기본 템플릿 해제
      if (template.is_default) {
        await client.query(
          `UPDATE video_templates 
           SET is_default = false
           WHERE user_id = $1 AND is_default = true`,
          [template.user_id]
        );
      }

      // 템플릿 생성
      const insertQuery = `
        INSERT INTO video_templates (
          user_id, template_name, description, 
          intro_video_path, outro_video_path, background_music_path, 
          output_directory, image_display_duration, is_default, 
          is_active, last_used_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id
      `;
      
      const values = [
        template.user_id,
        template.template_name,
        template.description || null,
        template.intro_video_path || null,
        template.outro_video_path || null,
        template.background_music_path || null,
        template.output_directory || null,
        template.image_display_duration,
        template.is_default,
        template.is_active,
        template.last_used_at || new Date()
      ];
      
      const result = await client.query(insertQuery, values);
      
      await client.query('COMMIT');
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 템플릿 업데이트
   * @param templateId 템플릿 ID
   * @param template 업데이트할 템플릿 정보
   * @returns 성공 여부
   */
  static async updateTemplate(templateId: number, template: Partial<VideoTemplate>): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 기존 템플릿 조회
      const existingTemplate = await this.getTemplate(templateId, template.user_id as number);
      if (!existingTemplate) {
        throw new Error('템플릿을 찾을 수 없습니다');
      }

      // 기본 템플릿 설정 변경 시 처리
      if (template.is_default && !existingTemplate.is_default) {
        await client.query(
          `UPDATE video_templates 
           SET is_default = false
           WHERE user_id = $1 AND is_default = true`,
          [existingTemplate.user_id]
        );
      }

      // 업데이트할 필드 추출
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 업데이트 필드 동적 생성
      const fieldMap: Record<string, any> = {
        template_name: template.template_name,
        description: template.description,
        intro_video_path: template.intro_video_path,
        outro_video_path: template.outro_video_path,
        background_music_path: template.background_music_path,
        output_directory: template.output_directory,
        image_display_duration: template.image_display_duration,
        is_default: template.is_default,
        is_active: template.is_active,
        last_used_at: template.last_used_at || new Date()
      };

      for (const [key, value] of Object.entries(fieldMap)) {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // 업데이트할 값이 없으면 성공으로 처리
      if (updateFields.length === 0) {
        await client.query('COMMIT');
        return true;
      }

      // 템플릿 ID와 사용자 ID 추가
      values.push(templateId);
      values.push(existingTemplate.user_id);

      // 업데이트 쿼리 실행
      const updateQuery = `
        UPDATE video_templates
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      `;
      
      await client.query(updateQuery, values);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 템플릿 삭제 (실제 삭제 대신 비활성화)
   * @param templateId 템플릿 ID
   * @param userId 사용자 ID
   * @returns 성공 여부
   */
  static async deleteTemplate(templateId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE video_templates
        SET is_active = false
        WHERE id = $1 AND user_id = $2
      `;
      const result = await pool.query(query, [templateId, userId]);
      
      if (result.rowCount === null) {
        return false;
      }

      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 템플릿 사용 기록 업데이트
   * @param templateId 템플릿 ID
   * @param userId 사용자 ID
   * @returns 성공 여부
   */
  static async updateTemplateUsage(templateId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE video_templates
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
      `;
      const result = await pool.query(query, [templateId, userId]);
      
      if (result.rowCount === null) {
        return false;
      }

      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}