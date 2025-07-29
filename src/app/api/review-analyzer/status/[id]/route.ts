import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // 개발 환경에서는 mock 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      // mock ID인지 확인
      if (id.startsWith('mock_')) {
        // 시간에 따라 상태 변화 시뮬레이션
        const timestamp = parseInt(id.split('_')[1]);
        const elapsed = Date.now() - timestamp;
        
        if (elapsed < 3000) {
          return NextResponse.json({
            status: 'processing',
            progress: Math.min(Math.floor(elapsed / 30), 99),
            message: '리뷰 데이터를 수집하고 있습니다...'
          });
        } else {
          return NextResponse.json({
            status: 'completed',
            progress: 100,
            message: '분석이 완료되었습니다!'
          });
        }
      }
    }

    const response = await fetch(`${PYTHON_API_URL}/status/${id}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '상태 확인에 실패했습니다.');
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('상태 확인 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 