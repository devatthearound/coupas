import { ImageProcessor } from './imageProcessor.js';

async function runTest() {
  try {
    console.log('이미지 생성 테스트를 시작합니다...');
    const result = await ImageProcessor.testCreateMultipleProductImages();
    console.log('테스트 완료! 생성된 이미지 경로들:', result);
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

runTest(); 