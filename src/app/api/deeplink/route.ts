import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { generateHmac } from '@/utils/hmacGenerator';
import { COUPANG_API_CONFIG } from '@/config/coupangApi';
import { DeeplinkRequest, DeeplinkResponse } from '@/types/coupang';

export async function POST(request: NextRequest) {
    try {
        const accessKey = request.headers.get('X-Coupang-Access-Key');
        const secretKey = request.headers.get('X-Coupang-Secret-Key');

        if (!accessKey || !secretKey) {
            return NextResponse.json(
                { message: '쿠팡 API 키가 제공되지 않았습니다' },
                { status: 400 }
            );
        }

        const body = await request.json() as DeeplinkRequest;
        const { coupangUrls } = body;

        if (!Array.isArray(coupangUrls) || coupangUrls.length === 0) {
            return NextResponse.json(
                { message: '올바른 URL 목록을 제공해주세요' },
                { status: 400 }
            );
        }

        const authorization = generateHmac(
            COUPANG_API_CONFIG.REQUEST_METHOD,
            COUPANG_API_CONFIG.URL,
            secretKey,
            accessKey
        );

        const response = await axios.request<DeeplinkResponse>({
            method: COUPANG_API_CONFIG.REQUEST_METHOD,
            baseURL: COUPANG_API_CONFIG.DOMAIN,
            url: COUPANG_API_CONFIG.URL,
            headers: { 
                Authorization: authorization,
                'Content-Type': 'application/json'
            },
            data: { coupangUrls }
        });

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('쿠팡 API 오류:', error);
        
        if (error instanceof Error) {
            return NextResponse.json(
                { message: '서버 오류가 발생했습니다', error: error.message },
                { status: 500 }
            );
        }

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { 
                    message: '쿠팡 API 오류가 발생했습니다',
                    error: error.response?.data || error.message
                },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { message: '알 수 없는 오류가 발생했습니다' },
            { status: 500 }
        );
    }
} 