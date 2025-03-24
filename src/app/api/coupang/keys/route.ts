import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// API 키 저장/수정
export async function POST(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    
    try {
        const { accessKey, secretKey } = await request.json();

        if (!accessKey || !secretKey) {
            return NextResponse.json(
                { message: 'API 키 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 기존 키가 있는지 확인
            const existingKey = await client.query(
                `SELECT id FROM coupang_api_keys 
                WHERE user_id = $1 AND is_active = true`,
                [userId]
            );

            if (existingKey.rows.length > 0) {
                // 기존 키 비활성화
                await client.query(
                    `UPDATE coupang_api_keys 
                    SET is_active = false, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = $1 AND is_active = true`,
                    [userId]
                );
            }

            // 새 키 저장
            await client.query(
                `INSERT INTO coupang_api_keys 
                (user_id, access_key, secret_key) 
                VALUES ($1, $2, $3)`,
                [userId, accessKey, secretKey]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                message: 'API 키가 성공적으로 저장되었습니다.'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('API 키 저장 중 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// API 키 조회
export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    
    try {
        const result = await pool.query(
            `SELECT access_key, secret_key 
            FROM coupang_api_keys 
            WHERE user_id = $1 AND is_active = true
            ORDER BY created_at DESC 
            LIMIT 1`,
            [userId]
        );

        return NextResponse.json({
            data: result.rows.length > 0 ? {
                accessKey: result.rows[0].access_key,
                secretKey: result.rows[0].secret_key
            } : null
        });

    } catch (error) {
        console.error('API 키 조회 중 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// API 키 삭제
export async function DELETE(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    
    try {
        const result = await pool.query(
            `UPDATE coupang_api_keys 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: '삭제할 API 키가 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'API 키가 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        console.error('API 키 삭제 중 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}