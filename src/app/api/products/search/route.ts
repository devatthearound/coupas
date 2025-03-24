import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { generateHmac } from '@/utils/hmacGenerator';
import { COUPANG_API_CONFIG } from '@/config/coupangApi';
// import * as cheerio from 'cheerio';
// import puppeteer, { Browser } from 'puppeteer';
import { ProductData } from '@/services/coupang/types';
// cheerio -> Html 파싱 라이브러리
// 실제론 puppeteer -> cheerio 로 변환해서 사용
  
interface SearchParams {
    keyword: string;
    limit?: number;
    subId?: string;
    imageSize?: string;
    srpLinkOnly?: boolean;
}

async function getReviewCount(url: string): Promise<{ reviewCount: number, starRating: number }> {
    // let browser: Browser | null = null;
    // try {
    //     console.log(`리뷰 크롤링 시작: ${url}`);
        
    //     browser = await puppeteer.launch({
    //         headless: true,
    //         defaultViewport: {
    //             width: 1920,
    //             height: 1080
    //         },
    //         args: [
    //             '--no-sandbox',
    //             '--disable-setuid-sandbox',
    //             '--disable-dev-shm-usage',
    //             '--window-size=1920,1080'
    //         ]
    //     });

    //     const page = await browser.newPage();
        
    //     // 더 자연스러운 브라우저 동작 시뮬레이션
    //     await page.setViewport({
    //         width: 1920 + Math.floor(Math.random() * 100),
    //         height: 1080 + Math.floor(Math.random() * 100),
    //         deviceScaleFactor: 1,
    //         hasTouch: false,
    //         isLandscape: false,
    //         isMobile: false
    //     });

    //     // 마우스 움직임 시뮬레이션
    //     // await page.mouse.move(
    //     //     100 + Math.floor(Math.random() * 100),
    //     //     100 + Math.floor(Math.random() * 100)
    //     // );

    //     // 스크롤 동작 시뮬레이션
    //     // await page.evaluate(() => {
    //     //     window.scrollBy(0, 100);
    //     //     return new Promise((resolve) => setTimeout(resolve, 500));
    //     // });

    //     // 요청 간격 랜덤화
    //     await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    //     // 필수 헤더 설정
    //     await page.setExtraHTTPHeaders({
    //         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    //         'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    //         'Cache-Control': 'no-cache',
    //         'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    //         'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    //         'sec-ch-ua-platform': '"macOS"'
    //     });

    //     // 그 다음 상품 페이지로 이동
    //     await page.goto(url, { 
    //         waitUntil: 'networkidle0',
    //         timeout: 100000 
    //     });

    //     const { reviewCount, starRating } = await page.evaluate(() => {
    //         // 리뷰 수 파싱
    //         const countElement = document.querySelector('.count');
    //         const reviewCount = countElement ? 
    //             parseInt(countElement.textContent?.replace(/[^0-9]/g, '') || '0') : 0;

    //         // 별점 파싱
    //         const ratingElement = document.querySelector('.rating-star-num');
    //         const ratingStyle = ratingElement?.getAttribute('style') || '';
    //         const ratingMatch = ratingStyle.match(/width:\s*([\d.]+)%/);
    //         const starRating = ratingMatch ? parseFloat(ratingMatch[1]) / 20 : 0; // 100% -> 5점 변환

    //         return { reviewCount, starRating };
    //     });

    //     console.log(`리뷰 수 추출 완료: ${reviewCount}, 별점: ${starRating}`);
    //     return { reviewCount, starRating };
    // } catch (error) {
    //     console.error('리뷰 수 크롤링 오류:', url, error instanceof Error ? error.message : '알 수 없는 오류');
    //     return { reviewCount: 0, starRating: 0 };
    // } finally {
    //     if (browser) {
    //         await new Promise(resolve => setTimeout(resolve, 5000));
    //         await browser.close();
    //     }
    // }
    return { reviewCount: 0, starRating: 0 };
}

export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    try {
        const accessKey = request.headers.get('X-Coupang-Access-Key');
        const secretKey = request.headers.get('X-Coupang-Secret-Key');

        if (!accessKey || !secretKey) {
            return NextResponse.json(
                { rCode: '-1', rMessage: '쿠팡 API 키가 제공되지 않았습니다' },
                { status: 400 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const keyword = searchParams.get('keyword');

        if (!keyword) {
            return NextResponse.json(
                { message: '검색 키워드는 필수입니다.' },
                { status: 400 }
            );
        }

        // 검색 파라미터 구성
        const params: SearchParams = {
            keyword,
            limit: Number(searchParams.get('limit')) || 10,
            // srpLinkOnly: searchParams.get('srpLinkOnly') === 'true'
        };


        // URL 파라미터 생성
        const queryString = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                queryString.append(key, value.toString());
            }
        });

        const apiUrl = `/v2/providers/affiliate_open_api/apis/openapi/products/search?${queryString.toString()}`;

        const authorization = generateHmac(
            'GET',
            apiUrl,
            secretKey,
            accessKey
        );

        const response = await axios.request({
            method: 'GET',
            baseURL: COUPANG_API_CONFIG.DOMAIN,
            url: apiUrl,
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json'
            }
        });


        // 검색 결과에서 상품 데이터 추출
        const products = response.data.data.productData;
        // const productUrls = products.map((product: ProductData) => `https://www.coupang.com/vp/products/${product.productId}`);
        // itemId= 추출
        const productUrls = products.map((product: ProductData) => `https://www.coupang.com/vp/products/${product.productId}?itemId=${product.productUrl.split('itemId=')[1].split('&')[0]}`);

        // 각 상품의 productUrl에 대해 deeplink API 호출

        const basePath = process.env.COUPAS_API_BASE_PATH || '';
        try {
            const deeplinkResponse = await fetch(`${basePath}/api/deeplink`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Coupang-Access-Key': accessKey,
                    'X-Coupang-Secret-Key': secretKey,
                    'Cookie': request.headers.get('cookie') || ''
                },
                body: JSON.stringify({ coupangUrls: productUrls })
            });

            const deeplinkData = await deeplinkResponse.json();
            
            console.log('리뷰 크롤링 시작');
            // 각 요청 사이에 지연 시간을 두어 순차적으로 처리
            const reviewPromises = productUrls.map(async (url: string, index: number) => {
                try {
                    // 각 요청 사이에 0.5초 간격을 둠 (cheerio는 더 빠르므로 간격 축소)
                    await new Promise(resolve => setTimeout(resolve, index * 500));
                    return await Promise.race([
                        getReviewCount(url)
                    ]);
                } catch (error) {
                    console.error('리뷰 크롤링 실패:', url, error instanceof Error ? error.message : '알 수 없는 오류');
                    return 0;
                }
            });

            const reviewCounts = await Promise.all(reviewPromises);
            console.log('리뷰 크롤링 완료:', reviewCounts);

            return NextResponse.json({
                rCode: '0',
                rMessage: 'success',
                data: {
                    productData: products.map((product: ProductData, index: number) => ({
                        ...product,
                        shortUrl: deeplinkData.data[index].shortenUrl,
                        reviewCount: reviewCounts[index].reviewCount,
                        starRating: reviewCounts[index].starRating
                    }))
                }
            });
        } catch (error) {
            console.error('Deeplink API 오류:', error);
            return NextResponse.json(response.data);
        }
    } catch (error) {
        console.error('쿠팡 검색 API 오류:', error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            if (status === 429) {
                return NextResponse.json(
                    { rCode: '-1', rMessage: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                {
                    rCode: '-1',
                    rMessage: '쿠팡 API 오류가 발생했습니다',
                    error: error.response?.data || error.message
                },
                { status }
            );
        }

        return NextResponse.json(
            { rCode: '-1', rMessage: '알 수 없는 오류가 발생했습니다' },
            { status: 500 }
        );
    }
} 