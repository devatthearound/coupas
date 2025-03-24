// app/api/auth/refresh-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/app/utils/jwt';
import pool from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    // JSON 요청 본문 파싱
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    // refreshToken 검증
    const decoded = await verifyToken(refreshToken);
    
    if (!decoded || !decoded.userId || decoded.type !== 'refresh') {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }
    
    // 사용자 조회
    const userResult = await pool.query(
        `SELECT 
            u.id,
            u.email,
            u.password,
            u.username,
            u.company_name,
            u.position
        FROM users u
        WHERE u.id = $1`
    ,[decoded.userId]);
  
    if (userResult.rows.length === 0) {
        return NextResponse.json(
            { error: 'User not found' },
            { status: 401 }
        );
    }

    const user = userResult.rows[0];
    const accessTokenMaxAge = 60 * 60; // 1시간 (초 단위)
    const refreshTokenMaxAge = 60 * 60 * 24 * 30; // 30일 (초 단위)

    // 새 accessToken 생성
    const newAccessToken = await generateToken({
      userId: user.id,
      name: user.username,
      email: user.email,
      type: 'access',
      // 추가 필요한 클레임
    }, accessTokenMaxAge); // 1시간 유효

    // 새 refreshToken 생성
    const newRefreshToken = await generateToken({
      userId: user.id,
      name: user.username,
      email: user.email,
      type: 'refresh',
      // 추가 필요한 클레임
    }, refreshTokenMaxAge); // 30일 유효

    // 응답 생성
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }, { status: 200 });

    // 쿠키 설정
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // accessToken 쿠키 설정
    response.cookies.set('coupas_access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAge, // 1시간
    });

    // refreshToken 쿠키 설정
    response.cookies.set('coupas_refresh_token', newRefreshToken, {
      ...cookieOptions,
      maxAge: refreshTokenMaxAge, // 30일
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
  }
}