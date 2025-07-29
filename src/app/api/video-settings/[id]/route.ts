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

// GET: 특정 설정 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const settings = readSettings();
    const setting = settings.find((s: any) => s.id === id);
    
    if (!setting) {
      return NextResponse.json(
        { error: '설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: setting
    });

  } catch (error) {
    console.error('설정 조회 오류:', error);
    return NextResponse.json(
      { error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 특정 설정 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const settings = readSettings();
    const settingIndex = settings.findIndex((s: any) => s.id === id);
    
    if (settingIndex === -1) {
      return NextResponse.json(
        { error: '설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const deletedSetting = settings.splice(settingIndex, 1)[0];
    writeSettings(settings);

    return NextResponse.json({
      success: true,
      data: deletedSetting
    });

  } catch (error) {
    console.error('설정 삭제 오류:', error);
    return NextResponse.json(
      { error: '설정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 