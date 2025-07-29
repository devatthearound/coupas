import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'sns-settings.json');

const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readSnsSettings = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      youtube: { connected: false, email: '' },
      threads: { connected: false, username: '', accountId: '' },
      instagram: { connected: false, username: '' },
      facebook: { connected: false, pageId: '' }
    };
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('SNS 설정 파일 읽기 오류:', error);
    return {
      youtube: { connected: false, email: '' },
      threads: { connected: false, username: '', accountId: '' },
      instagram: { connected: false, username: '' },
      facebook: { connected: false, pageId: '' }
    };
  }
};

const writeSnsSettings = (settings: any) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('SNS 설정 파일 쓰기 오류:', error);
    throw error;
  }
};

export async function GET() {
  try {
    const settings = readSnsSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('SNS 설정 조회 오류:', error);
    return NextResponse.json({ error: 'SNS 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, connected, ...platformData } = await request.json();

    if (!platform) {
      return NextResponse.json({ error: '플랫폼이 필요합니다.' }, { status: 400 });
    }

    const settings = readSnsSettings();
    
    // 플랫폼별 설정 업데이트
    settings[platform] = {
      connected: connected || false,
      ...platformData,
      updatedAt: new Date().toISOString()
    };

    writeSnsSettings(settings);

    return NextResponse.json({
      success: true,
      message: `${platform} 연동 상태가 업데이트되었습니다.`,
      data: settings[platform]
    });

  } catch (error) {
    console.error('SNS 설정 저장 오류:', error);
    return NextResponse.json({ error: 'SNS 설정 저장에 실패했습니다.' }, { status: 500 });
  }
} 