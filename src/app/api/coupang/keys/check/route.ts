import { NextRequest, NextResponse } from "next/server";
import pool from '@/app/lib/db';

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

    } catch (error) {
        console.error('API 키 존재 여부 확인 중 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 