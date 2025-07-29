import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Instagram Basic Display API 설정
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || '';
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || '';
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/instagram-auth/callback';

// 파일 기반 저장소
const DATA_FILE = path.join(process.cwd(), 'data', 'instagram-auth.json');

const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readInstagramTokens = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Instagram 토큰 파일 읽기 오류:', error);
    return {};
  }
};

const writeInstagramTokens = (tokens: any) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Instagram 토큰 파일 쓰기 오류:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: '인증 코드가 필요합니다.' }, { status: 400 });
    }

    // Access Token 교환
    const tokenParams = new URLSearchParams({
      client_id: INSTAGRAM_CLIENT_ID,
      client_secret: INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code: code,
    });

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('토큰 교환 실패');
    }

    const tokenData = await tokenResponse.json();

    // Long-lived token으로 교환
    const longLivedParams = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: INSTAGRAM_CLIENT_SECRET,
      access_token: tokenData.access_token,
    });

    const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?${longLivedParams.toString()}`, {
      method: 'GET',
    });

    if (!longLivedResponse.ok) {
      throw new Error('Long-lived token 교환 실패');
    }

    const longLivedData = await longLivedResponse.json();

    // 사용자 정보 가져오기
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longLivedData.access_token}`, {
      method: 'GET',
    });

    if (!userResponse.ok) {
      throw new Error('사용자 정보 가져오기 실패');
    }

    const userData = await userResponse.json();

    // 토큰 저장
    const tokens = {
      access_token: longLivedData.access_token,
      user_id: userData.id,
      username: userData.username,
      expires_at: Date.now() + (longLivedData.expires_in * 1000), // 60일
    };
    writeInstagramTokens(tokens);

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
      },
    });

  } catch (error) {
    console.error('Instagram 인증 오류:', error);
    return NextResponse.json({ error: 'Instagram 인증에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 현재 저장된 토큰 확인
    const tokens = readInstagramTokens();
    
    if (!tokens.access_token || !tokens.expires_at) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 });
    }

    // 토큰 만료 확인
    if (Date.now() > tokens.expires_at) {
      return NextResponse.json({ error: '토큰 만료됨' }, { status: 401 });
    }

    // 사용자 정보 반환
    return NextResponse.json({
      success: true,
      user: {
        id: tokens.user_id,
        username: tokens.username,
      },
      access_token: tokens.access_token,
    });

  } catch (error) {
    console.error('Instagram 토큰 확인 오류:', error);
    return NextResponse.json({ error: '토큰 확인에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // 토큰 삭제
    writeInstagramTokens({});
    
    return NextResponse.json({
      success: true,
      message: 'Instagram 연동이 해제되었습니다.',
    });

  } catch (error) {
    console.error('Instagram 연동 해제 오류:', error);
    return NextResponse.json({ error: 'Instagram 연동 해제에 실패했습니다.' }, { status: 500 });
  }
} 