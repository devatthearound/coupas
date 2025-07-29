import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, maxReviews = 100, analysisType = 'basic' } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // 개발 환경에서는 mock 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      // URL에서 상품 ID 추출
      let productId = 'unknown';
      if (url.includes('coupang.com')) {
        const match = url.match(/products\/(\d+)/);
        if (match) {
          productId = match[1];
        }
      }
      
      const mockAnalysisId = `mock_${Date.now()}_${productId}`;
      
      // 간단한 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({
        success: true,
        analysisId: mockAnalysisId,
        message: '분석이 시작되었습니다 (개발 모드)'
      });
    }

    // Python API 호출 (운영 환경)
    const response = await fetch(`${PYTHON_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        max_reviews: maxReviews,
        analysis_type: analysisType
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '분석 시작에 실패했습니다.');
    }

    return NextResponse.json({
      success: true,
      analysisId: data.analysis_id,
      message: data.message
    });

  } catch (error: any) {
    console.error('분석 시작 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}