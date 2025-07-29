import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-auth/callback';

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

// 토큰 갱신 함수
const refreshAccessToken = async (refreshToken: string) => {
  try {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    throw error;
  }
};

export async function GET() {
  try {
    const tokens = readGoogleTokens();
    
    if (!tokens.access_token) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 });
    }

    // 토큰 만료 확인
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      if (tokens.refresh_token) {
        try {
          // 토큰 갱신 시도
          const newTokens = await refreshAccessToken(tokens.refresh_token);
          
          const updatedTokenData = {
            ...tokens,
            access_token: newTokens.access_token,
            expires_at: newTokens.expiry_date || (Date.now() + 3600000),
            updated_at: new Date().toISOString()
          };
          
          writeGoogleTokens(updatedTokenData);
          
          return NextResponse.json({
            success: true,
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || tokens.refresh_token, // 기존 refresh_token 유지
            expires_at: newTokens.expiry_date
          });
        } catch (refreshError) {
          console.error('토큰 갱신 실패:', refreshError);
          return NextResponse.json({ error: '토큰 갱신 실패' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: '토큰 만료됨' }, { status: 401 });
      }
    }

    // 유효한 토큰 반환
    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at
    });

  } catch (error) {
    console.error('토큰 조회 오류:', error);
    return NextResponse.json({ error: '토큰 조회에 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { googleToken } = await request.json();
    
    if (!googleToken) {
      return NextResponse.json(
        { error: 'Google 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // 토큰 저장
    const tokenData = {
      access_token: googleToken,
      saved_at: new Date().toISOString(),
      source: 'external'
    };
    
    writeGoogleTokens(tokenData);

    return NextResponse.json({
      success: true,
      message: '토큰이 저장되었습니다.'
    });

  } catch (error) {
    console.error('토큰 저장 오류:', error);
    return NextResponse.json(
      { error: '토큰 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}