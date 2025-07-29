import { NextRequest, NextResponse } from "next/server";
import pool from '@/app/lib/db';

// Mock 데이터 (개발 환경용)
let mockApiKeys: Record<string, { accessKey: string; secretKey: string }> = {
    // 개발용 기본 API 키
    '7': {
        accessKey: '028d1bc3-8dab-43a8-b855-b1f21797b4f0',
        secretKey: 'b51e8cd97285c85c63184be9cb8e038237d8ae14'
    }
};

// API 키 존재 여부 확인
export async function GET(request: NextRequest) {
    // headers와 cookies 모두 확인
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
        console.error('userId not found in request');
        return NextResponse.json(
            { message: '인증 정보가 없습니다.' },
            { status: 401 }
        );
    }

    try {
        const result = await pool.query(
            `SELECT 1 FROM coupang_api_keys 
            WHERE user_id = $1 AND is_active = true 
            LIMIT 1`,
            [userId]
        );

        const exists = result.rows.length > 0;

        return NextResponse.json({
            success: true,
            exists,
            userId
        });

    } catch (dbError) {
        // DB 연결 실패 시 Mock 데이터 사용 (개발 환경)
        console.warn('DB 연결 실패, Mock 데이터 사용:', dbError);
        
        const exists = !!mockApiKeys[userId];

        return NextResponse.json({
            success: true,
            exists,
            userId,
            dev: true // 개발 모드 표시
        });
    }
} 