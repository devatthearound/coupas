import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // localhost:8000/generate-video 로 호출
    const res = await fetch('http://localhost:8000/generate-video', {
      method: 'POST',
      body: formData,
    });


    if (!res.ok) {
      throw new Error(`API 요청 실패: ${res.status}`);
    }

    const result = await res.json();
    
    return NextResponse.json({ 
      success: true, 
      message: '영상이 성공적으로 생성되었습니다.',
      data: result 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}