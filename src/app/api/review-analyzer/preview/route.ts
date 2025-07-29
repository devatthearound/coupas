import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // URL 유효성 검증
    const supportedPatterns = [
      /coupang\.com\/vp\/products/,
      /aliexpress\.com\/item/,
      /amazon\.com\/.*\/dp\//,
      /amazon\.co\.kr\/.*\/dp\//
    ];

    const isSupported = supportedPatterns.some(pattern => pattern.test(url));
    if (!isSupported) {
      return NextResponse.json(
        { error: '지원되지 않는 쇼핑몰입니다.' },
        { status: 400 }
      );
    }

    // 개발 환경에서는 URL 파싱으로 상품 정보 추출
    if (process.env.NODE_ENV === 'development') {
      let productInfo = {
        title: '상품명 미리보기',
        rating: 4.5,
        reviewCount: 1234,
        price: '29,900원',
        image: null
      };

      // URL 디코딩
      const decodedUrl = decodeURIComponent(url);
      console.log('분석할 URL (원본):', url);
      console.log('분석할 URL (디코딩):', decodedUrl);

      // 쿠팡 URL에서 상품 정보 추출
      if (url.includes('coupang.com')) {
        // 여러 패턴으로 상품 ID 추출 시도
        let productId = null;
        
        // 패턴 1: /products/숫자
        let match = decodedUrl.match(/products\/(\d+)/);
        if (!match) {
          // 패턴 2: 원본 URL에서도 시도
          match = url.match(/products\/(\d+)/);
        }
        if (!match) {
          // 패턴 3: %2F로 인코딩된 경우
          match = url.match(/products%2F(\d+)/);
        }
        
        if (match) {
          productId = match[1];
        }
        
        const itemIdMatch = url.match(/itemId=(\d+)/);
        
        console.log('추출된 정보:', {
          productId: productId,
          itemId: itemIdMatch ? itemIdMatch[1] : 'N/A'
        });
        
        if (productId) {
          // 실제 상품 ID에 따른 정확한 정보 반환
          if (productId === '7312583082') {
            productInfo.title = '마인크래프트 배우는 자구 대백과 (창작)';
            productInfo.rating = 4.7;
            productInfo.reviewCount = 72;
            productInfo.price = '16,020원';
          } else if (productId === '7635119586') {
            productInfo.title = '마인크래프트 스토리북 전 10권 세트';
            productInfo.rating = 4.7;
            productInfo.reviewCount = 139;
            productInfo.price = '132,120원';
          } else if (productId === '7451280339') {
            productInfo.title = '쿠팡 상품 - 새로운 상품';
            productInfo.rating = 4.5;
            productInfo.reviewCount = 100;
            productInfo.price = '가격 확인 필요';
          } else {
            // 기타 상품
            productInfo.title = `쿠팡 상품 (ID: ${productId})`;
            productInfo.rating = 4.5;
            productInfo.reviewCount = 100;
            productInfo.price = '가격 정보 없음';
          }
          
          console.log('최종 상품 정보:', productInfo);
        } else {
          console.log('상품 ID를 찾을 수 없습니다.');
          productInfo.title = 'URL에서 상품 정보를 찾을 수 없음';
        }
      }
      // 알리익스프레스 URL 처리
      else if (url.includes('aliexpress.com')) {
        const itemIdMatch = url.match(/item\/(\d+)/);
        if (itemIdMatch) {
          productInfo.title = `알리익스프레스 상품 (ID: ${itemIdMatch[1]})`;
        }
      }
      // 아마존 URL 처리
      else if (url.includes('amazon.')) {
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
          productInfo.title = `아마존 상품 (ASIN: ${asinMatch[1]})`;
        }
      }

      return NextResponse.json({
        success: true,
        product: productInfo
      });
    }

    // 운영 환경에서는 Python API 호출
    const response = await fetch(`${PYTHON_API_URL}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    if (data.success) {
      return NextResponse.json(data);
    } else {
      throw new Error(data.error || '상품 정보를 가져올 수 없습니다.');
    }

  } catch (error: any) {
    console.error('미리보기 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 