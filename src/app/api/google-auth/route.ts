import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import pool from '@/app/lib/db';

// Environment variables should be set in your .env.local file
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

// Get auth URL
export async function GET(request: NextRequest) {
  try {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',  // refresh_token을 받기 위해 필요
      prompt: 'consent',       // 매번 사용자 동의를 받아 refresh_token 재발급
      scope: SCOPES
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { message: '인증 URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Exchange code for tokens
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json(
      { message: '사용자 ID가 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { message: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
        // DB 클라이언트 직접 사용
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 기존 토큰 비활성화
      await client.query(
        `UPDATE google_auth SET is_active = false WHERE user_id = $1`,
        [userId]
      );
      
      // 새 토큰 저장
      await client.query(
        `INSERT INTO google_auth (user_id, access_token, refresh_token, scope, token_type, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, tokens.access_token, tokens.refresh_token, tokens.scope, 
         tokens.token_type, new Date(tokens.expiry_date || new Date().getTime() + 3600000)]
      );
      
      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json(
      { message: '토큰 교환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}