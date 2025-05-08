// src/app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TemplateStore, VideoTemplate } from '../../../../electron/main/templateStore';

// 템플릿 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    const templates = await TemplateStore.getTemplates(parseInt(userId));
    
    return NextResponse.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('템플릿 목록 조회 중 오류:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 템플릿 생성 API
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    const templateData = await request.json();
    
    // 필수 필드 검증
    if (!templateData.template_name) {
      return NextResponse.json(
        { message: '템플릿 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 사용자 ID 설정
    const template: VideoTemplate = {
      ...templateData,
      user_id: parseInt(userId),
      is_active: true,
      image_display_duration: templateData.image_display_duration || 3,
      is_default: templateData.is_default || false
    };

    const templateId = await TemplateStore.createTemplate(template);
    
    return NextResponse.json({
      success: true,
      message: '템플릿이 성공적으로 생성되었습니다.',
      data: { id: templateId }
    });
  } catch (error) {
    console.error('템플릿 생성 중 오류:', error);
    
    // 중복 템플릿 이름 오류 처리
    if (error instanceof Error && error.message.includes('video_templates_user_id_template_name_key')) {
      return NextResponse.json(
        { message: '이미 동일한 이름의 템플릿이 존재합니다.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}