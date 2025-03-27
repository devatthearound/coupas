import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { homedir } from 'os';
import { app } from 'electron';


export class ImageProcessor {
  static FONT_WEIGHTS = {
    Black: 'Pretendard-Black.otf',
    Bold: 'Pretendard-Bold.otf',
    ExtraBold: 'Pretendard-ExtraBold.otf',
    ExtraLight: 'Pretendard-ExtraLight.otf',
    Light: 'Pretendard-Light.otf',
    Medium: 'Pretendard-Medium.otf',
    Regular: 'Pretendard-Regular.otf',
    SemiBold: 'Pretendard-SemiBold.otf',
    Thin: 'Pretendard-Thin.otf'
  };

  static getFontPath(weight: string) {
    const fontFileName = ImageProcessor.FONT_WEIGHTS[weight as keyof typeof ImageProcessor.FONT_WEIGHTS];
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    
    // macOS 표준 폰트 경로
    const macFontPath = path.join(homeDir, 'Library/Fonts', fontFileName);
    
    // 애플리케이션 내장 폰트 폴더 (대체 경로)
    const appFontPath = path.join(app.getAppPath(), 'assets', 'fonts', fontFileName);
    
    // 리소스 폴더 내 폰트 (배포 시)
    const resourceFontPath = path.join(process.resourcesPath || '', 'assets', 'fonts', fontFileName);
    
    // 폰트 파일 존재 여부 확인 및 사용 가능한 경로 반환
    if (fs.existsSync(macFontPath)) {
      console.log('macOS 시스템 폰트 사용:', macFontPath);
      return macFontPath;
    } else if (fs.existsSync(appFontPath)) {
      console.log('앱 내장 폰트 사용:', appFontPath);
      return appFontPath;
    } else if (fs.existsSync(resourceFontPath)) {
      console.log('리소스 폰트 사용:', resourceFontPath);
      return resourceFontPath;
    }
    
    console.warn(`폰트 파일을 찾을 수 없습니다: ${fontFileName}`);
    // 폰트 없을 경우 기본 sans-serif 사용하도록 null 반환
    return null;
  }

  static async addTextToImage(
    backgroundPath: string,
    outputPath: string,
    productImgPath: string,
    videoTitle: string,
    productName: string,
    price: string,
    isRocket: boolean
  ) {
    try {
      console.log('이미지 생성 시작:', {
        backgroundPath,
        outputPath,
        productImgShort: productImgPath.substring(0, 50) + '...'
      });
      
      // 배경 이미지 존재 확인
      if (!fs.existsSync(backgroundPath)) {
        throw new Error(`배경 이미지 파일을 찾을 수 없습니다: ${backgroundPath}`);
      }
      
      // 출력 디렉토리 확인
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('출력 디렉토리 생성:', outputDir);
      }
      
      const image = sharp(backgroundPath);
      const metadata = await image.metadata();
      const width = metadata.width || 1920;
      const height = metadata.height || 1080;

      // 상품 이미지 처리 (웹 URL 또는 로컬 파일)
      let productImgBuffer;
      
      // 웹 URL인지 확인 (http 또는 https로 시작하는지)
      if (productImgPath.startsWith('http://') || productImgPath.startsWith('https://')) {
        try {
          // 웹 이미지를 가져와서 버퍼로 변환
          console.log('웹 이미지 다운로드 시도:', productImgPath);
          const response = await fetch(productImgPath);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          productImgBuffer = Buffer.from(await response.arrayBuffer());
          console.log('웹 이미지 다운로드 성공');
        } catch (error: any) {
          console.error('웹 이미지 다운로드 실패:', error);
          throw new Error(`상품 이미지를 가져오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        }
      } else {
        // 로컬 파일 경로인 경우
        if (!fs.existsSync(productImgPath)) {
          throw new Error(`상품 이미지 파일을 찾을 수 없습니다: ${productImgPath}`);
        }
        productImgBuffer = fs.readFileSync(productImgPath);
      }

      // 상품 이미지 리사이즈
      const productImg = await sharp(productImgBuffer)
        .resize(Math.floor(width * 0.4), Math.floor(height * 0.5), {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toBuffer();

      // 기본 위치 설정
      const defaultPositions = {
        title: { x: 0.03, y: 0.165, fontSize: 60 },
        name: { x: 0.03, y: 0.5, fontSize: 100 },
        price: { x: 0.03, y: 0.85, fontSize: 70 }
      };

      // 한국어에 더 적합한 문자 단위 텍스트 처리
      const maxCharsPerLine = 8; // 한 줄에 표시할 최대 글자 수 (한글 기준)
      const maxLines = 3; // 최대 줄 수
      
      let nameLines = [];
      let fontSize = defaultPositions.name.fontSize;
      
      // 문자 단위로 줄바꿈 처리 (공백 기준이 아닌 글자 수 기준)
      if (productName.length > maxCharsPerLine) {
        let remainingText = productName;
        
        // 각 줄에 대해 처리
        while (remainingText.length > 0 && nameLines.length < maxLines) {
          if (remainingText.length <= maxCharsPerLine) {
            // 남은 텍스트가 한 줄에 들어갈 경우
            nameLines.push(remainingText);
            break;
          } else {
            // 최대 글자 수에서 적절한 위치 찾기 (공백 또는 마지막 위치)
            let cutPoint = maxCharsPerLine;
            
            // 공백을 찾아 좀 더 자연스럽게 줄바꿈
            for (let i = maxCharsPerLine; i > 0; i--) {
              if (remainingText[i] === ' ') {
                cutPoint = i;
                break;
              }
            }
            
            // 현재 줄 추가
            nameLines.push(remainingText.substring(0, cutPoint));
            
            // 남은 텍스트 업데이트
            remainingText = remainingText.substring(cutPoint).trim();
            
            // 남은 텍스트가 너무 길고 이미 최대 줄 수에 도달했다면
            if (nameLines.length === maxLines - 1 && remainingText.length > maxCharsPerLine) {
              nameLines.push(remainingText.substring(0, maxCharsPerLine - 3) + '...');
              break;
            }
          }
        }
        
        // 줄 수에 따라 글꼴 크기 조정
        // if (nameLines.length > 1) {
        //   fontSize = Math.max(60, fontSize - (nameLines.length - 1) * 20);
        // }
      } else {
        // 한 줄에 표시 가능한 짧은 텍스트
        nameLines.push(productName);
      }

      // SVG 텍스트 요소 생성
      let nameTextSvg = '';
      const nameBaseY = height * defaultPositions.name.y - ((nameLines.length - 1) * fontSize * 0.7); // 여러 줄일 때 시작 Y 위치 조정
      
      nameLines.forEach((line, index) => {
        const yPosition = nameBaseY + (index * fontSize * 1.2); // 줄 간격 설정
        nameTextSvg += `<text x="${width * defaultPositions.name.x}" y="${yPosition}" 
          font-family="Pretendard" font-size="${fontSize}" font-weight="900">${line}</text>`;
      });

      const svgText = `
        <svg width="${width}" height="${height}">
          <text x="${width * defaultPositions.title.x}" y="${height * defaultPositions.title.y}" 
                font-family="Pretendard" font-size="${defaultPositions.title.fontSize}" font-weight="900">${videoTitle}</text>
          ${nameTextSvg}
          <text x="${width * defaultPositions.price.x}" y="${height * defaultPositions.price.y}" 
                font-family="Pretendard" font-size="${defaultPositions.price.fontSize}" font-weight="900">가격: ${price}원</text>
        </svg>`;

      // 이미지 합성
      await image
        .composite([
          {
            input: productImg,
            top: Math.floor(height * 0.29),
            left: Math.floor(width * 0.46)
          },
          {
            input: Buffer.from(svgText),
            top: 0,
            left: 0
          }
        ])
        .toFile(outputPath);

    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
      throw error;
    }
  }

  /**
   * 여러 제품 이미지를 생성하고 로컬 저장소에 저장합니다.
   * @param videoTitle 비디오 제목
   * @param productsList 제품 정보 목록
   * @param backgroundTemplatePath 배경 이미지 템플릿 경로
   * @param outputDir 결과 이미지를 저장할 디렉토리 경로
   * @returns 생성된 이미지 파일 경로 배열
   */
  static async createMultipleProductImages(
    videoTitle: string,
    productsList : {
      productName: string;      // 상품명
      productPrice: number;     // 가격
      rating?: number;          // 평점 (별점) - 선택적
      ratingCount?: number;     // 평점 갯수 - 선택적
      features?: string;        // 특징 - 선택적
      isRocket: boolean;        // 로켓배송 여부
      isFreeShipping: boolean;  // 무료배송 여부
      shortUrl: string;        // 상품 링크
      rank: number;            // 순위
    }[],
    backgroundTemplatePath: string,
    outputDir = path.join(process.cwd(), 'output_images')
  ) {
    const outputPaths = [];
    const tempDir = path.join(homedir(), 'temp_images');

    try {
      // 임시 디렉토리 생성
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 출력 디렉토리 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 각 상품에 대해 이미지 생성
      for (let i = 0; i < productsList.length; i++) {
        const product = productsList[i];
        const uniqueId = uuidv4();
        const finalOutputPath = path.join(outputDir, `product_image_${uniqueId}.png`);
        const tempOutputPath = path.join(tempDir, `product_image_${i + 1}_temp.png`);

        await this.addTextToImage(
          backgroundTemplatePath,
          tempOutputPath,
          product.productImage,
          videoTitle,
          product.productName,
          product.productPrice,
          product.isRocket || false
        );

        // 임시 파일을 최종 출력 위치로 이동
        fs.copyFileSync(tempOutputPath, finalOutputPath);
        outputPaths.push(finalOutputPath);
        console.log(`이미지 ${i + 1} 생성 완료: ${finalOutputPath}`);

        // 임시 파일 삭제
        fs.unlinkSync(tempOutputPath);
      }

      return outputPaths;

    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
      throw error;
    } finally {
      // 임시 디렉토리 정리
      this.cleanupTempFiles([tempDir]);
    }
  }

  /**
   * 임시 파일 정리
   * @param filePaths 삭제할 파일 경로 배열
   */
  static cleanupTempFiles(filePaths: string[]) {
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
            console.log('임시 디렉토리 삭제:', filePath);
          } else {
            fs.unlinkSync(filePath);
            console.log('임시 파일 삭제:', filePath);
          }
        } catch (err) {
          console.warn('임시 파일 삭제 실패:', filePath, err);
        }
      }
    });
  }

  static async generateProductImage(backgroundPath: string, outputPath: string, product: any) {
    // Implementation of generateProductImage method
  }
}