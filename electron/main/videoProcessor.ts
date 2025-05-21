import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { platform, homedir } from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { ImageProcessor } from './imageProcessor.js';
import { app } from 'electron';
import { execSync } from 'child_process';

// FFmpeg와 FFprobe 모듈 경로 직접 참조 시도
function getNonAsarPath(modulePath: string | null | undefined): string | undefined {
  if (!modulePath) return undefined;
  
  // Log the original path
  console.log('Resolving non-asar path for:', modulePath);
  
  // Check if we're in an asar archive
  if (modulePath.includes('app.asar')) {
    // Replace app.asar with app.asar.unpacked for unpacked resources
    const unpackedPath = modulePath.replace('app.asar', 'app.asar.unpacked');
    console.log('Converted to unpacked path:', unpackedPath);
    
    // Verify file existence
    try {
      const fs = require('fs');
      if (fs.existsSync(unpackedPath)) {
        console.log('Unpacked path exists:', unpackedPath);
        return unpackedPath;
      } else {
        console.error('Unpacked path does not exist:', unpackedPath);
      }
    } catch (err) {
      console.error('Error checking path existence:', err);
    }
  }
  
  return modulePath;
}

// FFmpeg 경로 안전하게 설정
function getSafeFfmpegPath() {
  try {
    // Import ffmpeg-static package
    const ffmpegPath = require('ffmpeg-static');
    console.log('Original ffmpeg path:', ffmpegPath);
    
    // For development environment, use the path directly
    if (process.env.NODE_ENV === 'development') {
      return ffmpegPath;
    }
    
    // For production, resolve the path correctly in the app.asar
    return getNonAsarPath(ffmpegPath);
  } catch (error) {
    console.error('Error getting ffmpeg path:', error);
    return null;
  }
}

// FFprobe 경로 안전하게 설정
function getSafeFfprobePath() {
  try {
    // Import ffprobe-static package
    const ffprobePath = require('ffprobe-static').path;
    console.log('Original ffprobe path:', ffprobePath);
    
    // For development environment, use the path directly
    if (process.env.NODE_ENV === 'development') {
      return ffprobePath;
    }
    
    // For production, resolve the path correctly in the app.asar
    return getNonAsarPath(ffprobePath);
  } catch (error) {
    console.error('Error getting ffprobe path:', error);
    return null;
  }
}

// 안전한 경로 가져오기
const safeFfmpegPath = getSafeFfmpegPath();
const safeFfprobePath = getSafeFfprobePath();

// 경로 확인 로그
console.log('최종 FFmpeg 설정 경로:', safeFfmpegPath);
console.log('최종 FFprobe 설정 경로:', safeFfprobePath);

// 경로가 실제로 존재하는지 한 번 더 확인
try {
  const ffmpegStats = fs.statSync(safeFfmpegPath);
  console.log('FFmpeg 파일 정보:', {
    isFile: ffmpegStats.isFile(),
    size: ffmpegStats.size,
    mode: ffmpegStats.mode
  });
  
  const ffprobeStats = fs.statSync(safeFfprobePath);
  console.log('FFprobe 파일 정보:', {
    isFile: ffprobeStats.isFile(),
    size: ffprobeStats.size,
    mode: ffprobeStats.mode
  });
} catch (error) {
  console.error('파일 상태 확인 중 오류:', error);
}

// FFmpeg 및 FFprobe 경로 설정
ffmpeg.setFfmpegPath(safeFfmpegPath);
ffmpeg.setFfprobePath(safeFfprobePath);

// 환경 변수에도 경로 설정 (추가 안전장치)
process.env.FFMPEG_PATH = safeFfmpegPath;
process.env.FFPROBE_PATH = safeFfprobePath;

// FFmpeg 명령어 테스트 (간단한 버전 확인)
try {
  console.log('FFmpeg 버전 확인 시도...');
  const versionOutput = execSync(`"${safeFfmpegPath}" -version`).toString();
  console.log('FFmpeg 버전 정보:', versionOutput.split('\n')[0]);
} catch (error) {
  console.error('FFmpeg 버전 확인 중 오류:', error);
}

// FFprobe 명령어 테스트
try {
  console.log('FFprobe 버전 확인 시도...');
  const versionOutput = execSync(`"${safeFfprobePath}" -version`).toString();
  console.log('FFprobe 버전 정보:', versionOutput.split('\n')[0]);
} catch (error) {
  console.error('FFprobe 버전 확인 중 오류:', error);
}

export class EnhancedVideoProcessor {
  /**
   * 두 개의 비디오와 N개의 이미지를 합쳐서 하나의 비디오로 만듭니다.
   * @param video1Path 첫 번째 비디오 경로
   * @param video2Path 두 번째 비디오 경로
   * @param imagePaths 이미지 파일 경로 배열
   * @param background_layout 상품 이미지
   * @param outputPath 최종 출력 비디오 경로
   * @param imageDisplayDuration 각 이미지 표시 시간(초), 기본값 3초
   * @param imageFps 이미지에서 생성된 비디오의 FPS, 기본값 30
   * @param videoFormat 출력 비디오 형식, 기본값 mp4
   */
  static combineVideosAndImages(
    videoTitle: string,
    introVideo: string,
    outroVideo: string,
    backgroundMusic: string,
    // backgroundTemplatePath: string,
    productInfo: {
      productName: string;
      productImage: string;
      productPrice: number;
      rating?: number;
      ratingCount?: number;
      features?: string;
      isRocket: boolean;
      isFreeShipping: boolean;
      shortUrl: string;
      rank: number;
    }[],
    logoPath: string,
    outputDirectory: string,
    imageDisplayDuration: number
  ) {
    const outputPath = path.join(outputDirectory, `${videoTitle}.mp4`);
    
    // 처리 과정 기록용 변수들 (추가된 코드)
    let createdFiles: string[] = [];
    let inProgress = false;
    
    return new Promise(async (resolve, reject) => {
      try {
        inProgress = true;
        const videoFormat = 'mp4';
        const imageFps = 30;
  
        console.log('비디오 처리 시작...');
        
        // 메모리 상태 로깅 (추가된 코드)
        console.log('초기 메모리 사용량:', process.memoryUsage());
        
        // 임시 디렉토리 경로 생성 및 확인
        const tmpDir = path.join(homedir(), 'Documents', 'Coupas', 'tmp_video_processing');
        console.log('임시 디렉토리 경로:', tmpDir);
        
        // 임시 디렉토리 생성 (존재하지 않을 경우)
        try {
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
            console.log('임시 디렉토리 생성 완료:', tmpDir);
          } else {
            console.log('임시 디렉토리가 이미 존재함:', tmpDir);
          }
        } catch (dirError) {
          console.error('임시 디렉토리 생성 중 오류:', dirError);
          
          // 오류 발생 시 정리 함수 호출 (추가된 코드)
          this.cleanupAndExit(createdFiles);
          
          reject({ success: false, error: dirError });
          return;
        }
  
        // 첫 번째 비디오 메타데이터 가져오기
        const video1Metadata = await VideoProcessor.getVideoMetadata(introVideo);
        const video1Dimensions = this.extractVideoDimensions(video1Metadata);
        console.log('비디오1 크기:', video1Dimensions);
  
        // 두 번째 비디오 메타데이터 가져오기
        const video2Metadata = await VideoProcessor.getVideoMetadata(outroVideo);
        const video2Dimensions = this.extractVideoDimensions(video2Metadata);
        console.log('비디오2 크기:', video2Dimensions);
  
        // 함수 사용 예시
        const productsList = productInfo;
  
        const outputDir = path.join(homedir(), 'Documents', 'Coupas', 'tmp_product_details');
        console.log('제품 이미지 출력 디렉토리:', outputDir);
        
        // 임시 파일 기록 (추가된 코드)
        createdFiles.push(outputDir);
  
        try {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log('제품 이미지 출력 디렉토리 생성 완료:', outputDir);
          } else {
            console.log('제품 이미지 출력 디렉토리가 이미 존재함:', outputDir);
          }
        } catch (outDirError) {
          console.error('제품 이미지 출력 디렉토리 생성 중 오류:', outDirError);
          
          // 오류 발생 시 정리 함수 호출 (추가된 코드)
          this.cleanupAndExit(createdFiles);
          
          reject({ success: false, error: outDirError });
          return;
        }
   
        // 함수 호출 - 이미지 생성 부분
        console.log('제품 이미지 생성 시작...');
        let productImagePaths;
        try {
          productImagePaths = await ImageProcessor.createMultipleProductImages(
            videoTitle,
            productsList,
            // backgroundTemplatePath,
            outputDir
          );
          console.log('생성된 제품 이미지 경로들:', productImagePaths);
          
          // 임시 파일 기록 (추가된 코드)
          if (productImagePaths && Array.isArray(productImagePaths)) {
            createdFiles = createdFiles.concat(productImagePaths);
          }
          
        } catch (imgError) {
          console.error('제품 이미지 생성 중 오류:', imgError);
          
          // 오류 발생 시 정리 함수 호출 (추가된 코드)
          this.cleanupAndExit(createdFiles);
          
          reject({ success: false, error: imgError });
          return;
        }
  
        // 생성된 이미지 존재 확인
        if (!productImagePaths || productImagePaths.length === 0) {
          const error = new Error('제품 이미지가 생성되지 않았습니다');
          console.error(error);
          
          // 오류 발생 시 정리 함수 호출 (추가된 코드)
          this.cleanupAndExit(createdFiles);
          
          reject({ success: false, error });
          return;
        }
  
        // 이미지를 비디오로 변환 - 비디오 크기에 맞춰서
        console.log('이미지를 비디오로 변환 중...');
        const targetWidth = video1Dimensions.width;
        const targetHeight = video1Dimensions.height;
        const imageVideoPath = path.join(tmpDir, `image_sequence.${videoFormat}`);
        
        // 임시 파일 기록 (추가된 코드)
        createdFiles.push(imageVideoPath);
        
        try {
          await this.createVideoFromImages(
            productImagePaths,
            imageVideoPath,
            backgroundMusic,
            imageDisplayDuration,
            imageFps,
            targetWidth,
            targetHeight
          );
          console.log('이미지 시퀀스 비디오 생성 완료:', imageVideoPath);
        } catch (videoError) {
          console.error('이미지를 비디오로 변환 중 오류:', videoError);
          
          // 오류 발생 시 정리 함수 호출 (추가된 코드)
          this.cleanupAndExit(createdFiles);
          
          reject({ success: false, error: videoError });
          return;
        }
  
        // 절대 경로로 변환
        const absolutePaths = [
          path.resolve(introVideo),
          path.resolve(imageVideoPath),
          path.resolve(outroVideo)
        ];
  
        // 파일 존재 여부 확인
        for (const filePath of absolutePaths) {
          if (!fs.existsSync(filePath)) {
            throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
          }
          console.log('파일 확인됨:', filePath);
        }
  
        // 중간 파일 경로 생성
        const normalizedPath1 = path.join(tmpDir, 'video1_normalized.mp4');
        const normalizedPath2 = path.join(tmpDir, 'video2_normalized.mp4');
        const normalizedPathImg = path.join(tmpDir, 'image_normalized.mp4');
        
        // 임시 파일 기록 (추가된 코드)
        createdFiles.push(normalizedPath1, normalizedPath2, normalizedPathImg);
        
        // 비디오 1 정규화 (코덱, 해상도 통일)
        await this.normalizeVideo(absolutePaths[0], normalizedPath1, targetWidth, targetHeight);
        
        // 이미지 시퀀스 정규화
        await this.normalizeVideo(absolutePaths[1], normalizedPathImg, targetWidth, targetHeight);
        
        // 비디오 2 정규화
        await this.normalizeVideo(absolutePaths[2], normalizedPath2, targetWidth, targetHeight);
  
        // 파일 리스트 생성
        const fileListPath = path.join(tmpDir, 'filelist.txt');
        
        // 임시 파일 기록 (추가된 코드)
        createdFiles.push(fileListPath);
        
        const fileListContent = [
          `file '${normalizedPath1.replace(/'/g, "'\\''")}'`,
          `file '${normalizedPathImg.replace(/'/g, "'\\''")}'`,
          `file '${normalizedPath2.replace(/'/g, "'\\''")}'`
        ].join('\n');
        fs.writeFileSync(fileListPath, fileListContent);
  
        // 메모리 사용량 체크 (추가된 코드)
        console.log('병합 전 메모리 사용량:', process.memoryUsage());
        
        // 주기적인 GC 실행 (추가된 코드)
        if (global.gc) {
          try {
            global.gc();
            console.log('GC 실행 후 메모리 사용량:', process.memoryUsage());
          } catch (e) {
            console.error('GC 실행 오류:', e);
          }
        }
  
        // 최종 concat 수행 (파일 기반 concat - 더 안정적)
        const command = ffmpeg()
          .input(fileListPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-movflags', '+faststart'
          ])
          .output(outputPath);
  
        // 로그 및 진행 상황 추가
        command
          .on('start', (commandLine) => {
            console.log('FFmpeg 최종 concat 명령어:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('최종 처리 중...', progress);
            
            // 추가된 코드: 진행률 10% 단위로 메모리 사용량 로깅
            if (progress.percent && Math.floor(progress.percent) % 10 === 0) {
              console.log(`${Math.floor(progress.percent)}% 완료, 메모리 사용량:`, process.memoryUsage());
            }
          })
          .on('end', () => {
            console.log('비디오 처리 완료');
            console.log('최종 출력 경로:', outputPath);
            
            inProgress = false;
            
            // 이미지 시퀀스 임시 파일 경로도 확인해서 추가
            const imageSequenceTempPath = imageVideoPath.replace(/\.\w+$/, '_temp.mp4');
            if (fs.existsSync(imageSequenceTempPath)) {
              createdFiles.push(imageSequenceTempPath);
            }
            
            // 임시 비디오 파일 정리
            this.cleanupTempFiles(createdFiles);
            
            // 명시적 GC 실행 (추가된 코드)
            if (global.gc) {
              try {
                global.gc();
                console.log('작업 완료 후 메모리 사용량:', process.memoryUsage());
              } catch (e) {
                console.error('GC 실행 오류:', e);
              }
            }
            
            // 파일이 실제로 생성되었는지 확인
            if (fs.existsSync(outputPath)) {
              resolve({ 
                success: true, 
                outputPath: outputPath
              });
            } else {
              reject({ 
                success: false, 
                error: '출력 파일이 생성되지 않았습니다',
                outputPath: null 
              });
            }
          })
          .on('error', (err, stdout, stderr) => {
            console.error('FFmpeg 오류:', err);
            console.error('FFmpeg 표준 출력:', stdout);
            console.error('FFmpeg 오류 출력:', stderr);
            
            inProgress = false;
            
            // 오류 발생 시 정리 함수 호출 (추가된 코드)
            this.cleanupAndExit(createdFiles);
            
            reject({ success: false, error: new Error(`FFmpeg 오류: ${err.message}\n${stderr}`) });
          });
  
        command.run();
      } catch (error) {
        console.error('처리 중 오류 발생:', error);
        
        // 진행 중이었다면 정리 (추가된 코드)
        if (inProgress) {
          this.cleanupAndExit(createdFiles);
        }
        
        reject({ success: false, error });
      }
    });
  }
  
  // 추가: cleanupAndExit 메서드 (클래스 내에 추가)
  static cleanupAndExit(filePaths: string[]) {
    this.cleanupTempFiles(filePaths);
    
    // 메모리 해제 시도
    if (global.gc) {
      try {
        global.gc();
        console.log('정리 후 메모리 사용량:', process.memoryUsage());
      } catch (e) {
        console.error('GC 실행 오류:', e);
      }
    }
  }

  /**
   * 비디오 정규화 - 해상도와 코덱 통일
   * @param inputPath 입력 비디오 경로
   * @param outputPath 출력 비디오 경로
   * @param width 목표 너비
   * @param height 목표 높이
   */
  static normalizeVideo(
    inputPath: any,
    outputPath: any,
    width: number,
    height: number
  ) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-vf', `fps=30,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
          '-ar', '44100',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('정규화 명령어:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`${path.basename(inputPath)} 정규화 중...`, progress);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('정규화 오류:', err);
          console.error('FFmpeg 오류 출력:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('정규화 완료:', outputPath);
          resolve(void 0);
        })
        .run();
    });
  }

/**
 * 이미지를 비디오로 변환하는 메서드 (2단계 처리 방식)
 * @param imagePaths 이미지 파일 경로 배열
 * @param outputPath 출력 비디오 경로
 * @param bgmPath 배경음악 경로
 * @param duration 각 이미지 표시 시간(초)
 * @param fps 프레임 레이트
 * @param targetWidth 목표 비디오 너비
 * @param targetHeight 목표 비디오 높이
 */
static createVideoFromImages(
  imagePaths: any,
  outputPath: any,
  bgmPath: any,
  duration = 3,
  fps = 30,
  targetWidth = 1920,
  targetHeight = 1080
) {
  return new Promise(async (resolve, reject) => {
    // 임시 파일 관리를 위한 배열 (추가된 코드)
    const tempFiles = [];
    
    try {
      console.log(`타겟 크기: ${targetWidth}x${targetHeight}`);
      
      // 메모리 사용량 로깅 (추가된 코드)
      console.log('이미지→비디오 시작 메모리:', process.memoryUsage());
      
      // 전체 비디오 길이 계산
      const totalVideoDuration = imagePaths.length * duration;
      console.log(`전체 비디오 길이: ${totalVideoDuration}초`);
      
      // 임시 파일 경로 (무음 비디오)
      const tempVideoPath = outputPath.replace(/\.\w+$/, '_temp.mp4');
      tempFiles.push(tempVideoPath);
      
      // 청크 단위로 처리 (추가된 코드)
      const MAX_CHUNK_SIZE = 10; // 한 번에 최대 10개 이미지만 처리
      
      if (imagePaths.length > MAX_CHUNK_SIZE) {
        console.log(`이미지가 ${imagePaths.length}개로 많아 ${MAX_CHUNK_SIZE}개씩 청크로 나누어 처리합니다.`);
        
        // 청크별 임시 비디오 경로 생성
        const chunkVideoPaths = [];
        
        // 청크 단위로 처리
        for (let i = 0; i < imagePaths.length; i += MAX_CHUNK_SIZE) {
          const chunkImages = imagePaths.slice(i, Math.min(i + MAX_CHUNK_SIZE, imagePaths.length));
          const chunkVideoPath = `${tempVideoPath.replace(/\.\w+$/, '')}_chunk_${i}.mp4`;
          chunkVideoPaths.push(chunkVideoPath);
          tempFiles.push(chunkVideoPath);
          
          console.log(`청크 ${i / MAX_CHUNK_SIZE + 1}/${Math.ceil(imagePaths.length / MAX_CHUNK_SIZE)} 처리 중 (${chunkImages.length}개 이미지)...`);
          
          // 각 청크별로 무음 비디오 생성
          await this.createSilentVideo(
            chunkImages,
            chunkVideoPath,
            duration,
            fps,
            targetWidth,
            targetHeight
          );
          
          // 청크 처리 후 메모리 해제 (추가된 코드)
          if (global.gc) {
            try {
              global.gc();
              console.log(`청크 ${i / MAX_CHUNK_SIZE + 1} 처리 후 메모리:`, process.memoryUsage());
            } catch (e) {
              console.error('GC 실행 오류:', e);
            }
          }
        }
        
        // 청크 비디오 합치기
        if (chunkVideoPaths.length > 1) {
          console.log('청크 비디오 합치는 중...');
          
          // 임시 파일 리스트 생성
          const chunkListPath = `${tempVideoPath.replace(/\.\w+$/, '')}_chunks.txt`;
          tempFiles.push(chunkListPath);
          
          const chunkListContent = chunkVideoPaths
            .map(p => `file '${p.replace(/'/g, "'\\''")}'`)
            .join('\n');
          
          fs.writeFileSync(chunkListPath, chunkListContent);
          
          // ffmpeg로 청크 비디오 합치기
          await new Promise((resolveChunk, rejectChunk) => {
            ffmpeg()
              .input(chunkListPath)
              .inputOptions(['-f', 'concat', '-safe', '0'])
              .outputOptions(['-c', 'copy'])
              .output(tempVideoPath)
              .on('end', resolveChunk)
              .on('error', rejectChunk)
              .run();
          });
          
          console.log('청크 비디오 합치기 완료');
        } else if (chunkVideoPaths.length === 1) {
          // 청크가 하나뿐이라면 그냥 복사
          fs.copyFileSync(chunkVideoPaths[0], tempVideoPath);
        }
      } else {
        // 이미지가 적은 경우 기존 방식으로 처리
        await this.createSilentVideo(
          imagePaths,
          tempVideoPath,
          duration,
          fps,
          targetWidth,
          targetHeight
        );
      }
      
      // 2단계: 무음 비디오에 오디오 추가
      await this.addAudioToVideo(tempVideoPath, bgmPath, outputPath, totalVideoDuration);
      
      // 임시 파일 정리
      this.cleanupTempFiles(tempFiles);
      
      // 최종 메모리 사용량 체크 (추가된 코드)
      if (global.gc) {
        try {
          global.gc();
          console.log('이미지→비디오 완료 후 메모리:', process.memoryUsage());
        } catch (e) {
          console.error('GC 실행 오류:', e);
        }
      }
      
      console.log('이미지 시퀀스 처리 완료');
      resolve(void 0);
    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
      
      // 오류 발생 시에도 임시 파일 정리
      this.cleanupTempFiles(tempFiles);
      
      reject(error);
    }
  });
}

/**
 * 이미지로부터 무음 비디오 생성
 */
static createSilentVideo(
  imagePaths: any,
  outputPath: any,
  duration: number,
  fps: number,
  width: number,
  height: number
) {
  return new Promise((resolve, reject) => {
    try {
      console.log('무음 비디오 생성 시작...');
      console.log(`이미지 개수: ${imagePaths.length}`);
      console.log(`첫 번째 이미지 경로: ${imagePaths[0]}`);
      
      // 이미지 파일 존재 여부 확인
      for (const imgPath of imagePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new Error(`이미지 파일을 찾을 수 없습니다: ${imgPath}`);
        }
      }
      
      // 출력 디렉토리 확인
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        console.log(`출력 디렉토리 생성 중: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const command = ffmpeg();
      
      // 이미지 입력 처리
      imagePaths.forEach((imagePath: any, index: number) => {
        command.input(imagePath)
          .inputOptions([
            '-loop', '1',
            '-t', duration.toString(),
            '-framerate', fps.toString()
          ]);
      });
      
      // 필터 체인 구성
      const filters = imagePaths.map((_ : any, i: number) => {
        return `[${i}:v]scale=${width}:${height},format=yuv420p[v${i}]`;
      });

      const scaledInputs = imagePaths.map((_ : any, i: number) => `[v${i}]`).join('');
      const concatFilter = `${filters.join(';')};${scaledInputs}concat=n=${imagePaths.length}:v=1:a=0[v]`;
      
      command
        .complexFilter(concatFilter)
        .outputOptions([
          '-map', '[v]',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-preset', 'medium'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('무음 비디오 생성 명령:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('무음 비디오 생성 중...', progress);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('무음 비디오 생성 오류:', err);
          console.error('FFmpeg 오류 출력:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('무음 비디오 생성 완료:', outputPath);
          resolve(void 0);
        });
      
      command.run();
    } catch (error) {
      console.error('무음 비디오 생성 중 오류 발생:', error);
      reject(error);
    }
  });
}

/**
 * 비디오에 오디오 추가
 */
static addAudioToVideo(
  videoPath: any,
  audioPath: any,
  outputPath: any,
  duration: number
) {
  return new Promise((resolve, reject) => {
    try {
      const command = ffmpeg();
      
      // 비디오와 오디오 입력
      command.input(videoPath);
      command.input(audioPath);
      
      command
        .outputOptions([
          '-c:v', 'copy',           // 비디오 재인코딩 없이 복사
          '-c:a', 'aac',            // 오디오는 AAC로 인코딩
          '-shortest',              // 가장 짧은 스트림 기준
          '-t', duration.toString(), // 명시적 길이 지정
          '-map', '0:v',            // 첫 번째 입력에서 비디오 가져오기
          '-map', '1:a'             // 두 번째 입력에서 오디오 가져오기
        ])
        .output(outputPath);

      command
        .on('start', (commandLine) => {
          console.log('2단계 - 오디오 추가 명령어:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('오디오 추가 중...', progress);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('오디오 추가 오류:', err);
          console.error('FFmpeg 오류 출력:', stderr);
          reject(new Error(`오디오 추가 오류: ${err.message}`));
        })
        .on('end', () => {
          console.log('오디오 추가 완료');
          resolve(void 0);
        });

      command.run();
    } catch (error) {
      reject(error);
    }
  });
}
  /**
   * 비디오 크기 추출
   * @param metadata 비디오 메타데이터
   */
  static extractVideoDimensions(metadata: any) {
    const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
    if (!videoStream) {
      throw new Error('비디오 스트림을 찾을 수 없습니다.');
    }
    return {
      width: videoStream.width,
      height: videoStream.height
    };
  }

  /**
   * 임시 파일 정리
   * @param filePaths 삭제할 파일 경로 배열
   */
  static cleanupTempFiles(filePaths: any) {
    filePaths.forEach((filePath: any) => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('임시 파일 삭제:', filePath);
        } catch (err) {
          console.warn('임시 파일 삭제 실패:', filePath, err);
        }
      }
    });
  }
}

// VideoProcessor 클래스 (상속을 위해 필요)
export class VideoProcessor {
  /**
   * 비디오 메타데이터 추출 메서드
   * @param inputPath 입력 비디오 경로
   */
  static getVideoMetadata(inputPath: any) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }
}