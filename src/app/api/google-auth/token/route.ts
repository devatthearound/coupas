import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// 구글 인증 정보 저장
export async function POST(request: NextRequest) {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json(
            { message: '사용자 ID가 필요합니다.' },
            { status: 401 }
        );
    }

    try {
        const { accessToken, refreshToken, scope, tokenType, expiryDate } = await request.json();

        if (!accessToken || !refreshToken || !scope || !tokenType || !expiryDate) {
            return NextResponse.json(
                { message: '구글 인증 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 기존 인증 정보 비활성화
            await client.query(
                `UPDATE google_auth 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = $1 AND is_active = true`,
                [userId]
            );

            // 새 인증 정보 저장
            await client.query(
                `INSERT INTO google_auth 
                (user_id, access_token, refresh_token, scope, token_type, expiry_date) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, accessToken, refreshToken, scope, tokenType, new Date(expiryDate)]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                message: '구글 인증 정보가 성공적으로 저장되었습니다.'
            });

        } catch (error) {
            if (error instanceof Error && error.message.includes('invalid_grant')) {
                return NextResponse.json(
                    { message: '인증 코드가 유효하지 않거나 만료되었습니다.' },
                    { status: 400 }
                );
            }
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('구글 인증 정보 저장 중 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 토큰 갱신 함수
async function refreshAccessToken(refreshToken: string) {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        return {
            accessToken: credentials.access_token,
            expiryDate: credentials.expiry_date
        };
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
        throw error;
    }
}

// 구글 인증 정보 조회
export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json(
            { message: '사용자 ID가 필요합니다.' },
            { status: 401 }
        );
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT access_token, refresh_token, scope, token_type, expiry_date 
            FROM google_auth 
            WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { message: '구글 인증 정보가 없습니다.' },
                { status: 404 }
            );
        }

        const authInfo = result.rows[0];
        const now = new Date();
        const expiryDate = new Date(authInfo.expiry_date);

        // 토큰이 만료되었거나 곧 만료될 예정인 경우 (5분 이내)
        if (expiryDate.getTime() - now.getTime() < 300000) {
            try {
                const { accessToken, expiryDate: newExpiryDate } = 
                    await refreshAccessToken(authInfo.refresh_token);

                // 새로운 액세스 토큰으로 업데이트
                await client.query(
                    `UPDATE google_auth 
                    SET access_token = $1, expiry_date = $2, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = $3 AND is_active = true`,
                    [accessToken, new Date(newExpiryDate || Date.now() + 3600000), userId]
                );

                return NextResponse.json({
                    data: {
                        accessToken,
                        refreshToken: authInfo.refresh_token,
                        scope: authInfo.scope,
                        tokenType: authInfo.token_type,
                        expiryDate: newExpiryDate
                    }
                });
            } catch (error) {
                console.error('토큰 갱신 실패:', error);
                // 갱신 실패 시 인증 정보 삭제
                await client.query(
                    `UPDATE google_auth SET is_active = false 
                    WHERE user_id = $1 AND is_active = true`,
                    [userId]
                );
                return NextResponse.json(
                    { message: '인증이 만료되었습니다. 재인증이 필요합니다.' },
                    { status: 401 }
                );
            }
        }

        // 토큰이 유효한 경우 기존 정보 반환
        return NextResponse.json({
            data: {
                accessToken: authInfo.access_token,
                refreshToken: authInfo.refresh_token,
                scope: authInfo.scope,
                tokenType: authInfo.token_type,
                expiryDate: authInfo.expiry_date
            }
        });

    } catch (error) {
        console.error('구글 인증 정보 조회 중 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}