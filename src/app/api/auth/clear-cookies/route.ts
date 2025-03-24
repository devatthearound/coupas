import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // 쿠키 삭제를 위해 만료 시간을 과거로 설정
  response.cookies.set({
    name: 'coupas_access_token',
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0  // 즉시 만료
  });

  response.cookies.set({
    name: 'coupas_refresh_token',
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0  // 즉시 만료
  });

  return response;
} 