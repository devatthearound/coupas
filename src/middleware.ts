import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/app/utils/jwt'

// 공개 접근이 허용된 경로들을 정의
const PUBLIC_PATHS = [
  '/api/healthy',
  '/api/auth/set-cookies',
  '/api/auth/refresh-token',
  '/api/user/me',
  '/_next',
  '/favicon.ico',
  '/images',
  '/google-auth/callback',
  '/external-redirect',
];

// 미들웨어를 적용할 경로 설정 수정
export const config = {
  matcher: [
    '/:path*',
    '/api/:path*'  // 모든 API 경로에 대해 미들웨어 적용
  ]
};

const isElectronUserAgent = (request: NextRequest) => {
  const userAgent = request.headers.get('user-agent') || '';
  
  // 대소문자 구분 없이 'electron' 또는 'coupas' 검사
  const ua = userAgent.toLowerCase();
  return ua.includes('electron') || ua.includes('coupas');
};

// 리다이렉트 URL 생성 함수 수정
const handleUnauthorized = (request: NextRequest, type: 'login' | 'payment') => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const webPath = encodeURIComponent(basePath + request.nextUrl.pathname + request.nextUrl.search);
  const electronPath = encodeURIComponent(`coupas-auth://login`);
  
  let redirectUrl: string;
  
  if (type === 'login') {
    redirectUrl = `https://growsome.kr/login?redirect_to=${electronPath}`;
  } else {
    redirectUrl = `https://growsome.kr/payment?product_id=1&redirect_to=${electronPath}`;
  }

  if (isElectronUserAgent(request)) {
    // 중간 페이지로 리다이렉션
    return NextResponse.redirect(new URL(`/external-redirect?url=${encodeURIComponent(redirectUrl)}`, request.url));
  }

  return NextResponse.redirect(new URL(redirectUrl));
};

async function refreshTokens(request: NextRequest, refreshToken: string): Promise<{ newAccessToken: string; newRefreshToken: string }> {
  try {
    const url = new URL('/api/auth/refresh-token', request.url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Token refresh failed - Status: ${response.status}, ` +
        `URL: ${url.toString()}, ` +
        `Response: ${errorData}`
      );
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new Error(
        `Invalid response format - ` +
        `Expected accessToken in response, got: ${JSON.stringify(data)}`
      );
    }

    return {
      newAccessToken: data.accessToken,
      newRefreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error('Token refresh error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: request.url,
      refreshToken: refreshToken ? '***' : 'null'
    });
    throw error;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("pathname", pathname);
  // 1. 미들웨어 없이 통과할 경로 체크
  //    - '/' 경로는 미들웨어 검증 없이 통과
  if (pathname === '/') {
    return NextResponse.next();
  }

  //    - PUBLIC_PATHS에 선언된 경로는 미들웨어 검증 없이 통과
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. HttpOnly 쿠키로 저장된 accessToken, refreshToken 조회
  const accessToken = request.cookies.get('coupas_access_token')?.value;
  const refreshToken = request.cookies.get('coupas_refresh_token')?.value;

  if (!accessToken) {
    if (!refreshToken) {
      return handleUnauthorized(request, 'login');
    } else {
      try {
        // CASE 2: refreshToken만 존재하는 경우 리프레시 토큰을 사용하여 새로운 엑세스 토큰을 발급
        const { newAccessToken } = await refreshTokens(request, refreshToken);
        const decoded = await verifyToken(newAccessToken);
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', decoded.userId.toString());
  
        // 새로운 응답 생성
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        // 새로운 accessToken을 쿠키에 설정
        response.cookies.set('coupas_access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 // 1시간
        });

        return response;
      } catch (error) {
        console.log('Token refresh failed, redirecting to login:', error);
        // refreshToken이 유효하지 않은 경우 모든 인증 쿠키를 제거
        const response = handleUnauthorized(request, 'login');
        response.cookies.delete('coupas_access_token');
        response.cookies.delete('coupas_refresh_token');
        return response;
      }
    }
  } else {
    try {
      const decoded = await verifyToken(accessToken);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId.toString());

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // accessToken이 만료된 경우 refreshToken으로 재시도
      if (refreshToken) {
        try {
          const { newAccessToken } = await refreshTokens(request, refreshToken);
          const decoded = await verifyToken(newAccessToken);
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set('x-user-id', decoded.userId.toString());
    
          const response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          response.cookies.set('coupas_access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 // 1시간
          });

          return response;
        } catch (refreshError) {
          console.log('Both tokens invalid, redirecting to login:', refreshError);
          const response = handleUnauthorized(request, 'login');
          response.cookies.delete('coupas_access_token');
          response.cookies.delete('coupas_refresh_token');
          return response;
        }
      }
      return handleUnauthorized(request, 'login');
    }
  }
}