import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { verifyToken } from '@/app/utils/jwt';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
  try {
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

    const { email, newPassword, currentPassword } = await req.json();

    // 현재 비밀번호 확인
    const userRes = await pool.query('SELECT password FROM users WHERE id=$1', [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: '사용자 없음' }, { status: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!valid) {
      return NextResponse.json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 });
    }

    // 이메일/비밀번호 변경
    let updateQuery = 'UPDATE users SET';
    const params: any[] = [];
    let idx = 1;
    if (email) {
      updateQuery += ` email=$${idx++},`;
      params.push(email);
    }
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      updateQuery += ` password=$${idx++},`;
      params.push(hash);
    }
    updateQuery = updateQuery.replace(/,$/, ''); // 마지막 콤마 제거
    updateQuery += ` WHERE id=$${idx}`;
    params.push(userId);

    await pool.query(updateQuery, params);

    return NextResponse.json({ success: true, message: '계정 정보가 수정되었습니다.' });
  } catch (e) {
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('coupas_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: '인증 필요' }, { status: 401 });
    }
    const decoded = await verifyToken(accessToken);
    const userId = decoded.userId;

    // 계정을 완전히 삭제하는 대신 status를 'deleted'로 변경
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['deleted', userId]);
    
    // 쿠키 삭제
    const response = NextResponse.json({ success: true, message: '계정이 삭제되었습니다.' });
    response.cookies.delete('coupas_access_token');
    
    return response;
  } catch (e) {
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}