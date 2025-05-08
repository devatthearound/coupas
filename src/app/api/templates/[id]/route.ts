// src/app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TemplateStore } from '../../../../../electron/main/templateStore';

// 개별 템플릿 조회 API
export async function GET(
  request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
      const id = (await params).id // 'a', 'b', or 'c'
  
      if (!id) {
        return Response.json(
            { error: 'ID is required' },
            { status: 400 }
        );
    }

    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    const templateId = parseInt(id);
    const template = await TemplateStore.getTemplate(templateId, parseInt(userId));
    
    if (!template) {
      return NextResponse.json(
        { message: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('템플릿 조회 중 오류:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개별 템플릿 업데이트 API
export async function PUT(
  request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
      const id = (await params).id // 'a', 'b', or 'c'

    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    const templateId = parseInt(id);
    const templateData = await request.json();
    
    // 업데이트 데이터에 사용자 ID 추가
    templateData.user_id = parseInt(userId);
    
    // 템플릿 업데이트
    const success = await TemplateStore.updateTemplate(templateId, templateData);
    
    if (!success) {
      return NextResponse.json(
        { message: '템플릿 업데이트에 실패했습니다.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '템플릿이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('템플릿 업데이트 중 오류:', error);
    
    // 템플릿 없음 오류 처리
    if (error instanceof Error && error.message.includes('템플릿을 찾을 수 없습니다')) {
      return NextResponse.json(
        { message: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
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

// 템플릿 삭제 API (비활성화)
export async function DELETE(
  request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id // 'a', 'b', or 'c'

    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    const templateId = parseInt(id);
    const success = await TemplateStore.deleteTemplate(templateId, parseInt(userId));
    
    if (!success) {
      return NextResponse.json(
        { message: '템플릿을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '템플릿이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('템플릿 삭제 중 오류:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}