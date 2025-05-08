// src/services/templates/api.ts
import { fetchWrapper } from '@/utils/fetchWrapper';

/**
 * 템플릿 타입 정의
 */
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
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 응답 타입 정의
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 템플릿 서비스 클래스
 */
export const templateService = {
  /**
   * 모든 템플릿 목록 조회
   * @returns 템플릿 목록
   */
  getTemplates: async (): Promise<VideoTemplate[]> => {
    try {
      const response = await fetchWrapper('/api/templates');
      return (response as ApiResponse<VideoTemplate[]>).data || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * 기본 또는 마지막 사용 템플릿 조회
   * @returns 기본 템플릿 또는 마지막 사용 템플릿
   */
  getDefaultTemplate: async (): Promise<VideoTemplate | null> => {
    try {
      const response = await fetchWrapper('/api/templates/default');
      return (response as ApiResponse<VideoTemplate>).data || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 개별 템플릿 조회
   * @param id 템플릿 ID
   * @returns 템플릿 정보
   */
  getTemplate: async (id: number): Promise<VideoTemplate | null> => {
    try {
      const response = await fetchWrapper(`/api/templates/${id}`);
      return (response as ApiResponse<VideoTemplate>).data || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 생성
   * @param template 템플릿 정보
   * @returns 생성된 템플릿 ID
   */
  createTemplate: async (template: Partial<VideoTemplate>): Promise<number> => {
    try {
      const response = await fetchWrapper('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      return (response as ApiResponse<{ id: number }>).data?.id || 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 업데이트
   * @param id 템플릿 ID
   * @param template 업데이트할 템플릿 정보
   * @returns 성공 여부
   */
  updateTemplate: async (id: number, template: Partial<VideoTemplate>): Promise<boolean> => {
    try {
      const response = await fetchWrapper(`/api/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      return (response as ApiResponse<any>).success || false;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 삭제
   * @param id 템플릿 ID
   * @returns 성공 여부
   */
  deleteTemplate: async (id: number): Promise<boolean> => {
    try {
      const response = await fetchWrapper(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      return (response as ApiResponse<any>).success || false;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 사용 기록 업데이트
   * @param id 템플릿 ID
   * @returns 성공 여부
   */
  updateTemplateUsage: async (id: number): Promise<boolean> => {
    try {
      const response = await fetchWrapper(`/api/templates/${id}/usage`, {
        method: 'POST',
      });
      return (response as ApiResponse<any>).success || false;
    } catch (error) {
      throw error;
    }
  }
};
