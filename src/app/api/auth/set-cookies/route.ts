// app/api/auth/set-cookies/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Both access token and refresh token are required' },
        { status: 400 }
      );
    }

    // 응답 객체 생성
    const response = NextResponse.json(
      { success: true, message: 'Cookies set successfully' },
      { status: 200 }
    );

    // 쿠키 설정
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // accessToken 쿠키 설정
    response.cookies.set('coupas_access_token', accessToken, {
      ...cookieOptions,
      // 토큰 자체의 만료 시간과 일치하도록 설정 (예: 1시간)
      maxAge: 60 * 60,
    });

    // refreshToken 쿠키 설정
    response.cookies.set('coupas_refresh_token', refreshToken, {
      ...cookieOptions,
      // refreshToken은 더 오래 유지 (예: 30일)
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Error setting cookies:', error);
    return NextResponse.json(
      { error: 'Failed to set cookies' },
      { status: 500 }
    );
  }
}