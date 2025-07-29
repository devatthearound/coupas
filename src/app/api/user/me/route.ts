// app/api/user/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt';
import pool from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 개발 환경에서 localStorage의 토큰 확인
    const authHeader = request.headers.get('authorization');
    let devToken = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      devToken = authHeader.substring(7);
    }
    
    // 개발 환경에서 토큰이 있으면 Mock 사용자 정보 반환
    if (devToken && process.env.NODE_ENV === 'development') {
      try {
        const payload = JSON.parse(atob(devToken.split('.')[1]));
        const mockUser = {
          id: payload.userId || '7',
          name: 'Development User',
          email: payload.email || 'growsome.me@gmail.com',
          role: 'user'
        };
        
        return NextResponse.json({
          authenticated: true,
          user: mockUser,
          dev: true
        });
      } catch (error) {
        console.error('개발용 토큰 파싱 오류:', error);
      }
    }
    
    // 요청 헤더에서 사용자 ID 가져오기 (미들웨어에서 설정)
    const userId = request.headers.get('x-user-id');
    
    // 헤더에 사용자 ID가 없으면 접근 토큰에서 다시 검증
    if (!userId) {
      const accessToken = request.cookies.get('coupas_access_token')?.value;
      
      if (!accessToken) {
        // 인증 정보가 없을 때 401 대신 200으로 응답하되 인증 상태 정보 포함
        return NextResponse.json({
          authenticated: false,
          user: null,
          message: '인증 정보가 없습니다'
        }, { status: 200 });
      }
      
      try {
        // 토큰 검증
        const decoded = await verifyToken(accessToken);
        if (!decoded.userId) {
          // 유효하지 않은 토큰일 때도 200으로 응답
          return NextResponse.json({
            authenticated: false,
            user: null,
            message: '유효하지 않은 토큰입니다'
          }, { status: 200 });
        }
        
        // 사용자 조회 (DB 연결 실패 시 Mock 데이터 사용)
        try {
          const userResult = await pool.query(
            `SELECT 
                u.id,
                u.email,
                u.password,
                u.username,
                u.company_name,
                u.position,
                u.phone_number
            FROM users u
            WHERE u.id = $1
            AND u.status = 'active'`
          ,[decoded.userId]);
    
          if (userResult.rows.length === 0) {
            // 사용자를 찾을 수 없을 때도 200으로 응답
            return NextResponse.json({
              authenticated: false,
              user: null,
              message: '사용자를 찾을 수 없습니다'
            }, { status: 200 });
          }

          const user = userResult.rows[0];
          
          // 안전한 사용자 정보 반환 (민감한 데이터 제외)
          const safeUserData = {
            id: user.id,
            name: user.username,
            email: user.email,
            company_name: user.company_name,
            position: user.position,
            phone_number: user.phone_number,
            role: user.role,
            // 필요한 다른 사용자 정보
          };
          
          return NextResponse.json({
            authenticated: true,
            user: safeUserData
          });
        } catch (dbError) {
          // DB 연결 실패 시 Mock 사용자 정보 반환
          console.warn('DB 연결 실패, Mock 사용자 정보 사용:', dbError);
          const mockUser = {
            id: decoded.userId,
            name: 'Development User',
            email: decoded.email || 'growsome.me@gmail.com',
            role: 'user'
          };
          
          return NextResponse.json({
            authenticated: true,
            user: mockUser,
            dev: true
          });
        }
      } catch (error) {
        // 토큰 오류 시에도 200으로 응답
        return NextResponse.json({
          authenticated: false,
          user: null,
          message: '토큰 검증 중 오류가 발생했습니다'
        }, { status: 200 });
      }
    }
    
    // 사용자 ID가 있는 경우 (미들웨어에서 이미 인증됨)
    try {
      const userResult = await pool.query(
        `SELECT 
            u.id,
            u.email,
            u.password,
            u.username,
            u.company_name,
            u.position,
            u.phone_number
        FROM users u
        WHERE u.id = $1
        AND u.status = 'active'`
      ,[userId]);
    
      if (userResult.rows.length === 0) {
        return NextResponse.json({
          authenticated: false,
          user: null,
          message: '사용자를 찾을 수 없습니다'
        }, { status: 200 });
      }

      const user = userResult.rows[0];
      
      // 안전한 사용자 정보 반환
      const safeUserData = {
        id: user.id,
        name: user.username,
        email: user.email,
        company_name: user.company_name,
        position: user.position,
        phone_number: user.phone_number,
        role: user.role,
      };
      
      return NextResponse.json({
        authenticated: true,
        user: safeUserData
      });
    } catch (dbError) {
      // DB 연결 실패 시 Mock 사용자 정보 반환
      console.warn('DB 연결 실패, Mock 사용자 정보 사용:', dbError);
      const mockUser = {
        id: userId,
        name: 'Development User',
        email: 'growsome.me@gmail.com',
        role: 'user'
      };
      
      return NextResponse.json({
        authenticated: true,
        user: mockUser,
        dev: true
      });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    // 서버 오류 시에도 200으로 응답하되 상태 정보 포함
    return NextResponse.json({
      authenticated: false,
      user: null,
      message: '서버 오류가 발생했습니다'
    }, { status: 200 });
  }
}