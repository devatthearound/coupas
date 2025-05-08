// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { verifyToken } from '@/app/utils/jwt';
// 예시: 실제로는 DB 연결/유저 인증 필요
export async function PATCH(req: NextRequest) {
  try{
      // 요청 헤더에서 사용자 ID 가져오기 (미들웨어에서 설정)
      const userId = req.headers.get('x-user-id');
    
      // 헤더에 사용자 ID가 없으면 접근 토큰에서 다시 검증
      if (!userId) {
        const accessToken = req.cookies.get('coupas_access_token')?.value;
        
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
          
          // 사용자 조회
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
            WHERE u.id = $1`
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
        } catch (error) {
          // 토큰 오류 시에도 200으로 응답
          return NextResponse.json({
            authenticated: false,
            user: null,
            message: '토큰 검증 중 오류가 발생했습니다'
          }, { status: 200 });
        }
      }

      const body = await req.json();
      const { name, phone_number, company_name, position } = body;
    
      const userResult = await pool.query(
        `UPDATE users SET username = $1, phone_number = $2, company_name = $3, position = $4 WHERE id = $5`,
        [name, phone_number, company_name, position, userId]
      );

      // 성공 응답
      return NextResponse.json({
        success: true,
        message: '프로필이 수정되었습니다.',
        data: { name, phone_number, company_name, position }
      });

    }catch(error){
      return NextResponse.json({
        success: false,
        message: '프로필 수정 중 오류가 발생했습니다'
      }, { status: 500 });
    }
}