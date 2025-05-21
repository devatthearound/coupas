// videoWorker.js - 비디오 처리를 위한 별도 프로세스
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs');
const path = require('path');

// FFmpeg 경로 설정
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// 메시지 수신 리스너
process.on('message', async (data) => {
  try {
    // 비디오 처리 코드...
    
    // 작업 완료 시 결과 반환
    process.send({ success: true, outputPath: data.outputPath });
    
    // 작업 완료 후 정상 종료
    process.exit(0);
  } catch (error) {
    process.send({ success: false, error: error.message });
    process.exit(1);
  }
});