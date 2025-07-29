import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    // AI로 제목 생성 (여러 템플릿 중 랜덤 선택)
    const titleTemplates = [
      `🔥 2025년 ${keyword} 가성비 TOP 5 추천! 할인 정보 포함 🛒`,
      `💥 ${keyword} 최고의 선택! 2025년 베스트 5개 상품 대공개`,
      `🏆 ${keyword} 순위 TOP 5 | 2025년 가성비 최강 추천템`,
      `✨ ${keyword} 완벽 가이드! 2025년 인기 순위 베스트 5`,
      `🎯 ${keyword} 구매 전 필수시청! 2025년 TOP 5 완벽 비교`,
      `🔥 ${keyword} 가성비 끝판왕! 2025년 추천 순위 TOP 5`,
      `💎 ${keyword} 베스트 픽! 2025년 할인가 포함 TOP 5`,
      `🚀 ${keyword} 인기 폭발! 2025년 가성비 갑 순위 공개`,
      `⭐ ${keyword} 완벽 분석! 2025년 최고 추천 TOP 5`,
      `🔍 ${keyword} 꼼꼼 비교! 2025년 베스트 5 상품 총정리`
    ];

    const randomIndex = Math.floor(Math.random() * titleTemplates.length);
    const generatedTitle = titleTemplates[randomIndex];

    return NextResponse.json({
      success: true,
      title: generatedTitle
    });

  } catch (error) {
    console.error('제목 생성 오류:', error);
    return NextResponse.json(
      { error: '제목 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 