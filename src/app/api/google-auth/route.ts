import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Environment variables should be set in your .env.local file
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-auth/callback';
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

// 파일 기반 저장소
const DATA_FILE = path.join(process.cwd(), 'data', 'google-auth.json');

const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readGoogleTokens = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Google 토큰 파일 읽기 오류:', error);
    return {};
  }
};

const writeGoogleTokens = (tokens: any) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Google 토큰 파일 쓰기 오류:', error);
    throw error;
  }
};

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
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { message: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    
    // 인증 코드를 토큰으로 교환
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.json(
        { message: 'Access token을 받지 못했습니다.' },
        { status: 400 }
      );
    }

    // 파일에 토큰 저장
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date || (Date.now() + 3600000),
      scope: tokens.scope,
      token_type: tokens.token_type,
      saved_at: new Date().toISOString()
    };
    
    writeGoogleTokens(tokenData);

    return NextResponse.json({ 
      success: true,
      message: '토큰이 성공적으로 저장되었습니다.',
      access_token: tokens.access_token 
    });

  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json(
      { message: '인증 코드 교환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Delete tokens (연동 해제)
export async function DELETE() {
  try {
    // 토큰 파일 삭제
    writeGoogleTokens({});
    
    return NextResponse.json({
      success: true,
      message: '유튜브 연동이 해제되었습니다.',
    });

  } catch (error) {
    console.error('Google 연동 해제 오류:', error);
    return NextResponse.json({ error: 'Google 연동 해제에 실패했습니다.' }, { status: 500 });
  }
}