import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // 개발 환경에서는 실제 상품 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      if (id.startsWith('mock_')) {
        // 분석 ID에서 상품 ID 추출
        const parts = id.split('_');
        const productId = parts[2] || 'unknown';
        
        console.log('분석 중인 상품 ID:', productId);
        
        let mockResults;
        
        if (productId === '7312583082') {
          // 마인크래프트 배우는 자구 대백과
          mockResults = {
            success: true,
            data: {
              productInfo: {
                title: '마인크래프트 배우는 자구 대백과 (창작)',
                rating: 4.7,
                reviewCount: 72,
                price: '16,020원',
                image: null
              },
              sentimentAnalysis: {
                positive: 78,
                negative: 8,
                neutral: 14
              },
              keywordAnalysis: [
                { keyword: '마인크래프트', count: 52, sentiment: 'positive' },
                { keyword: '아이들', count: 38, sentiment: 'positive' },
                { keyword: '교육', count: 31, sentiment: 'positive' },
                { keyword: '재미있어요', count: 28, sentiment: 'positive' },
                { keyword: '창의력', count: 24, sentiment: 'positive' },
                { keyword: '배우기', count: 21, sentiment: 'positive' },
                { keyword: '게임', count: 19, sentiment: 'neutral' },
                { keyword: '어려워요', count: 12, sentiment: 'negative' },
                { keyword: '가격', count: 15, sentiment: 'neutral' }
              ],
              reviewSummary: {
                totalReviews: 72,
                analyzedReviews: 72,
                averageRating: 4.7,
                recommendations: [
                  '아이들이 마인크래프트를 배우는데 매우 유용한 책',
                  '창의력과 상상력 개발에 도움이 된다는 평가',
                  '체계적인 구성으로 단계별 학습 가능'
                ]
              },
              generatedAt: new Date().toISOString()
            }
          };
                 } else if (productId === '7635119586') {
                     // 마인크래프트 스토리북 10권 세트 (실제 상품 데이터)
           mockResults = {
             success: true,
             data: {
               productInfo: {
                 title: '마인크래프트 스토리북 전 10권 세트',
                 rating: 4.7,
                 reviewCount: 139,
                 price: '132,120원',
                 image: null
               },
              sentimentAnalysis: {
                positive: 72,
                negative: 12,
                neutral: 16
              },
              keywordAnalysis: [
                { keyword: '스토리북', count: 65, sentiment: 'positive' },
                { keyword: '10권세트', count: 58, sentiment: 'positive' },
                { keyword: '마인크래프트', count: 54, sentiment: 'positive' },
                { keyword: '아이들', count: 42, sentiment: 'positive' },
                { keyword: '스토리', count: 38, sentiment: 'positive' },
                { keyword: '재미있어요', count: 35, sentiment: 'positive' },
                { keyword: '가격', count: 28, sentiment: 'negative' },
                { keyword: '비싸요', count: 24, sentiment: 'negative' },
                { keyword: '구성', count: 22, sentiment: 'positive' },
                { keyword: '만족', count: 31, sentiment: 'positive' }
              ],
              reviewSummary: {
                totalReviews: 139,
                analyzedReviews: 139,
                averageRating: 4.5,
                recommendations: [
                  '마인크래프트를 좋아하는 아이들에게 완벽한 스토리북 세트',
                  '10권으로 구성되어 오래 읽을 수 있어 만족도 높음',
                  '가격이 다소 비싸다는 의견이 있지만 구성품을 고려하면 합리적',
                  '스토리 내용이 재미있고 상상력 개발에 도움',
                  '마인크래프트 팬이라면 강력 추천'
                ]
              },
              generatedAt: new Date().toISOString()
            }
          };
         } else if (productId === '7451280339') {
           // 새로운 상품 (7451280339)
           mockResults = {
             success: true,
             data: {
               productInfo: {
                 title: '쿠팡 상품 - 새로운 상품 분석',
                 rating: 4.5,
                 reviewCount: 100,
                 price: '가격 확인 필요',
                 image: null
               },
               sentimentAnalysis: {
                 positive: 68,
                 negative: 18,
                 neutral: 14
               },
               keywordAnalysis: [
                 { keyword: '품질', count: 45, sentiment: 'positive' },
                 { keyword: '배송', count: 38, sentiment: 'positive' },
                 { keyword: '가격', count: 32, sentiment: 'neutral' },
                 { keyword: '만족', count: 29, sentiment: 'positive' },
                 { keyword: '추천', count: 26, sentiment: 'positive' },
                 { keyword: '좋아요', count: 24, sentiment: 'positive' },
                 { keyword: '빠름', count: 21, sentiment: 'positive' },
                 { keyword: '포장', count: 19, sentiment: 'positive' },
                 { keyword: '아쉬워요', count: 15, sentiment: 'negative' },
                 { keyword: '불만', count: 12, sentiment: 'negative' }
               ],
               reviewSummary: {
                 totalReviews: 100,
                 analyzedReviews: 100,
                 averageRating: 4.5,
                 recommendations: [
                   '전반적으로 만족도가 높은 상품',
                   '품질과 배송에 대한 긍정적 평가',
                   '가격 대비 성능이 우수함',
                   '일부 개선 요소는 있지만 추천할 만함'
                 ]
               },
               generatedAt: new Date().toISOString()
             }
           };
                 } else {
           // 기본 상품 (샘플 데이터)
           mockResults = {
             success: true,
             data: {
               productInfo: {
                 title: '샘플 상품 - 분석 결과',
                 rating: 4.3,
                 reviewCount: 95,
                 price: '25,000원',
                 image: null
               },
               sentimentAnalysis: {
                 positive: 65,
                 negative: 20,
                 neutral: 15
               },
               keywordAnalysis: [
                 { keyword: '품질', count: 42, sentiment: 'positive' },
                 { keyword: '가격', count: 35, sentiment: 'neutral' },
                 { keyword: '배송', count: 28, sentiment: 'positive' },
                 { keyword: '포장', count: 21, sentiment: 'positive' },
                 { keyword: '만족', count: 38, sentiment: 'positive' }
               ],
               reviewSummary: {
                 totalReviews: 95,
                 analyzedReviews: 95,
                 averageRating: 4.3,
                 recommendations: [
                   '전반적으로 좋은 평가를 받고 있는 상품',
                   '품질 대비 가격이 합리적',
                   '배송과 포장에 대한 만족도 높음'
                 ]
               },
               generatedAt: new Date().toISOString()
             }
           };
         }
        
                 return NextResponse.json(mockResults);
      }
    }

    const response = await fetch(`${PYTHON_API_URL}/results/${id}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '결과 조회에 실패했습니다.');
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('결과 조회 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 