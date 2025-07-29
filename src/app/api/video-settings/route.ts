import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 데이터 저장 경로
const DATA_FILE = path.join(process.cwd(), 'data', 'video-settings.json');

// 데이터 디렉토리 생성
const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// 설정 데이터 읽기
const readSettings = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('설정 파일 읽기 오류:', error);
    return [];
  }
};

// 설정 데이터 쓰기
const writeSettings = (settings: any[]) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('설정 파일 쓰기 오류:', error);
    throw error;
  }
};

// GET: 모든 설정 조회
export async function GET() {
  try {
    const settings = readSettings();
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('설정 조회 오류:', error);
    return NextResponse.json(
      { error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 설정 저장
export async function POST(request: NextRequest) {
  try {
    const newSetting = await request.json();
    
    // 필수 필드 검증
    if (!newSetting.name || !newSetting.introVideo || !newSetting.outroVideo || !newSetting.backgroundMusic || !newSetting.outputDirectory) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const settings = readSettings();
    
    // 새 설정 생성
    const setting = {
      id: Date.now().toString(),
      name: newSetting.name,
      introVideo: newSetting.introVideo,
      outroVideo: newSetting.outroVideo,
      backgroundMusic: newSetting.backgroundMusic,
      imageDisplayDuration: newSetting.imageDisplayDuration || 3,
      outputDirectory: newSetting.outputDirectory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    settings.push(setting);
    writeSettings(settings);

    return NextResponse.json({
      success: true,
      data: setting
    });

  } catch (error) {
    console.error('설정 저장 오류:', error);
    return NextResponse.json(
      { error: '설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
} 