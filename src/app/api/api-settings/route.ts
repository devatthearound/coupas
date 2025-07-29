import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'api-settings.json');

const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readApiSettings = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      coupang: { accessKey: '', secretKey: '', enabled: false },
      aliexpress: { accessKey: '', secretKey: '', enabled: false },
      amazon: { accessKey: '', secretKey: '', enabled: false }
    };
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('API 설정 파일 읽기 오류:', error);
    return {
      coupang: { accessKey: '', secretKey: '', enabled: false },
      aliexpress: { accessKey: '', secretKey: '', enabled: false },
      amazon: { accessKey: '', secretKey: '', enabled: false }
    };
  }
};

const writeApiSettings = (settings: any) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('API 설정 파일 쓰기 오류:', error);
    throw error;
  }
};

export async function GET() {
  try {
    const settings = readApiSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('API 설정 조회 오류:', error);
    return NextResponse.json({ error: 'API 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, accessKey, secretKey } = await request.json();

    if (!platform || !accessKey || !secretKey) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const settings = readApiSettings();
    
    // 플랫폼별 설정 업데이트
    settings[platform] = {
      accessKey,
      secretKey,
      enabled: true,
      updatedAt: new Date().toISOString()
    };

    writeApiSettings(settings);

    return NextResponse.json({
      success: true,
      message: `${platform.toUpperCase()} API 설정이 저장되었습니다.`,
      data: settings[platform]
    });

  } catch (error) {
    console.error('API 설정 저장 오류:', error);
    return NextResponse.json({ error: 'API 설정 저장에 실패했습니다.' }, { status: 500 });
  }
} 