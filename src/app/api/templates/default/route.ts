// src/app/api/templates/default/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TemplateStore } from '../../../../../electron/main/templateStore';
// 기본 또는 마지막 사용 템플릿 조회 API
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    // 기본 템플릿 조회 시도
    let template = await TemplateStore.getDefaultTemplate(parseInt(userId));
    
    // 기본 템플릿이 없으면 마지막 사용 템플릿 조회
    if (!template) {
      template = await TemplateStore.getLastUsedTemplate(parseInt(userId));
    }
    
    if (!template) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '사용 가능한 템플릿이 없습니다.'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('기본 템플릿 조회 중 오류:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// src/app/api/templates/[id]/usage/route.ts
export async function POST(
  request: NextRequest,
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
    const success = await TemplateStore.updateTemplateUsage(templateId, parseInt(userId));
    
    if (!success) {
      return NextResponse.json(
        { message: '템플릿 사용 기록 업데이트에 실패했습니다.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '템플릿 사용 기록이 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('템플릿 사용 기록 업데이트 중 오류:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}