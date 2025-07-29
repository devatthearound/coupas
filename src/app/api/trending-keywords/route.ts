import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'trending-keywords.json');

const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readKeywords = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('키워드 파일 읽기 오류:', error);
    return [];
  }
};

const writeKeywords = (keywords: any[]) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(keywords, null, 2));
  } catch (error) {
    console.error('키워드 파일 쓰기 오류:', error);
    throw error;
  }
};

// 키워드 조회 (오늘의 추천 키워드)
export async function GET() {
  try {
    const keywords = readKeywords();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 오늘 날짜의 키워드 찾기
    let todayKeywords = keywords.find((item: any) => item.date === today);
    
    // 오늘 키워드가 없으면 가장 최근 키워드 사용
    if (!todayKeywords && keywords.length > 0) {
      // 키워드를 날짜 순으로 정렬하여 가장 최근 키워드 가져오기
      const sortedKeywords = keywords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      todayKeywords = sortedKeywords[0];
    }
    
    if (!todayKeywords) {
      return NextResponse.json({
        success: true,
        data: {
          date: today,
          keywords: [],
          message: '추천 키워드가 아직 수집되지 않았습니다.'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: todayKeywords
    });

  } catch (error) {
    console.error('키워드 조회 오류:', error);
    return NextResponse.json({ error: '키워드를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// 키워드 저장 (봇에서 호출)
export async function POST(request: NextRequest) {
  try {
    const { keywords: newKeywords } = await request.json();

    if (!newKeywords || !Array.isArray(newKeywords)) {
      return NextResponse.json({ error: '키워드 배열이 필요합니다.' }, { status: 400 });
    }

    const keywords = readKeywords();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 오늘 날짜의 기존 데이터 찾기
    const existingIndex = keywords.findIndex((item: any) => item.date === today);
    
    const keywordData = {
      date: today,
      keywords: newKeywords.slice(0, 5), // 최대 5개까지
      collectedAt: new Date().toISOString(),
      source: 'youtube_monitor'
    };

    if (existingIndex >= 0) {
      // 기존 데이터 업데이트
      keywords[existingIndex] = keywordData;
    } else {
      // 새 데이터 추가
      keywords.unshift(keywordData);
    }

    // 최근 30일 데이터만 유지
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const filteredKeywords = keywords.filter((item: any) => item.date >= cutoffDate);
    
    writeKeywords(filteredKeywords);

    return NextResponse.json({
      success: true,
      message: `${newKeywords.length}개의 키워드가 저장되었습니다.`,
      data: keywordData
    });

  } catch (error) {
    console.error('키워드 저장 오류:', error);
    return NextResponse.json({ error: '키워드 저장에 실패했습니다.' }, { status: 500 });
  }
}

// 최근 키워드 히스토리 조회
export async function PUT() {
  try {
    const keywords = readKeywords();
    
    // 최근 7일 데이터 반환
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    const recentKeywords = keywords.filter((item: any) => item.date >= cutoffDate);

    return NextResponse.json({
      success: true,
      data: recentKeywords
    });

  } catch (error) {
    console.error('키워드 히스토리 조회 오류:', error);
    return NextResponse.json({ error: '키워드 히스토리를 불러오는데 실패했습니다.' }, { status: 500 });
  }
} 