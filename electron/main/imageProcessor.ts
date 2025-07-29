import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { homedir } from 'os';
import electron from 'electron';
const { app } = electron;


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

  // 배경 이미지 경로를 가져오는 메서드로 변경
  private static getBackgroundImagePath() {
    const isDev = process.env.NODE_ENV === 'development';
    console.log('현재 환경:', isDev ? '개발' : '프로덕션');

    // import.meta.url 대신 __dirname 사용
    const possiblePaths = [
      // 개발 환경 경로
      path.join(process.cwd(), 'electron', 'assets', 'background_layout_1.png'),
      // 빌드된 경로
      path.join(__dirname, 'assets', 'background_layout_1.png'),
      // resources 폴더 경로
      path.join(process.resourcesPath || '', 'assets', 'background_layout_1.png')
    ];

    console.log('=== 배경 이미지 경로 검색 시작 ===');
    console.log('현재 작업 디렉토리:', process.cwd());
    console.log('__dirname:', __dirname);
    
    for (const p of possiblePaths) {
      console.log(`검사 중: ${p}`);
      try {
        if (fs.existsSync(p)) {
          console.log(`✅ 배경 이미지 찾음: ${p}`);
          return p;
        }
      } catch (error) {
        console.log(`❌ 경로 접근 오류: ${p}`, error);
      }
      console.log(`❌ 파일 없음: ${p}`);
    }

    throw new Error(
      '배경 이미지를 찾을 수 없습니다.\n' +
      '시도한 경로들:\n' +
      possiblePaths.map(p => `- ${p}`).join('\n')
    );
  }

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
    outputPath: string,
    productImgPath: string,
    videoTitle: string,
    productName: string,
    price: string,
    rank: number,
    isRocket: boolean,
    discountRate?: number,
    rating?: number,
    ratingCount?: number,
    features?: string
  ) {
    try {
      const backgroundTemplatePath = this.getBackgroundImagePath();
      
      // 출력 디렉토리 확인
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('출력 디렉토리 생성:', outputDir);
      }
      
      const image = sharp(backgroundTemplatePath);
      const metadata = await image.metadata();
      const width = metadata.width || 1920;
      const height = metadata.height || 1080;

      // 상품 이미지 처리 (웹 URL 또는 로컬 파일)
      let productImgBuffer;
      
      // 웹 이미지를 가져와서 버퍼로 변환

      try {
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

      // 상품 이미지 리사이즈
      const productImg = await sharp(productImgBuffer)
        .resize(Math.floor(width * 0.4), Math.floor(height * 0.5), {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toBuffer();

      // 기본 위치 설정
      const defaultPositions = {
        rank: { x: 0.34, y: 0.315, fontSize: 83, color: '#FFFFFF', weight: '900', letterSpacing: -0.3 },
        title: { startX: 0.04, endX: 0.32, y: 0.165, fontSize: 47, color: '#091E42', weight: '900', letterSpacing: -0.3 },
        name: { x: 0.04, y: 0.5, fontSize: 83, color: '#091E42', weight: '900', letterSpacing: -0.3 },
        price: { x: 0.04, y: 0.89, fontSize: 36, color: '#091E42', weight: '700', letterSpacing: -0.3 },
        rating: { x: 0.37, y: 0.89, fontSize: 36, color: '#091E42', weight: '700', letterSpacing: -0.3 },
        features: { x: 0.37,  y: 0.94, fontSize: 36, color: '#091E42', weight: '700', letterSpacing: -0.3 },
        isNextDayDelivery : { x: 0.79, y: 0.89, fontSize: 47, color: '#FF8B00', weight: '900', letterSpacing: -0.3 },
        isRocket: { x: 0.87, y: 0.96, fontSize: 47, color: '#FF8B00', weight: '900', letterSpacing: -0.3 }
      };

      // 한국어에 더 적합한 문자 단위 텍스트 처리
      const maxCharsPerLine = 8; // 한 줄에 표시할 최대 글자 수 (한글 기준)
      const maxLines = 5; // 최대 줄 수
      
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
        const yPosition = nameBaseY + (index * fontSize * 1.2);
        nameTextSvg += `<text 
          x="${width * defaultPositions.name.x}" 
          y="${yPosition}" 
          fill="${defaultPositions.name.color}"
          font-weight="${defaultPositions.name.weight}"
          font-size="${fontSize}"
          style="letter-spacing: ${defaultPositions.name.letterSpacing}px">${line}</text>`;
      });

      const generateStarRating = (rating: number, x: number, y: number, starSize: number = 60) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const totalStars = 5;
        let starsHtml = '';
        
        for (let i = 0; i < totalStars; i++) {
          const starX = x + (i * (starSize - 20));  // 간격을 40에서 20으로 수정
          if (i < fullStars) {
            // 채워진 별
            starsHtml += `<path transform="translate(${starX},${y}) scale(0.06)" fill="#FFA726" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>`;
          } else if (i === fullStars && hasHalfStar) {
            // 반쪽 별
            starsHtml += `<path transform="translate(${starX},${y}) scale(0.06)" fill="#FFA726" d="M288 439.6V17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6z"/>`;
            starsHtml += `<path transform="translate(${starX},${y}) scale(0.06)" fill="#E0E0E0" d="M288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0"/>`;
          } else {
            // 빈 별
            starsHtml += `<path transform="translate(${starX},${y}) scale(0.06)" fill="#E0E0E0" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>`;
          }
        }
        return starsHtml;
      };


      const svgText = `
        <svg width="${width}" height="${height}">
          <defs>
            <style>
              text {
                font-family: Pretendard;
                letter-spacing: -0.3px;
              }
            </style>
          </defs>
          ${rank ? `<text 
            x="${width * defaultPositions.rank.x}" 
            y="${height * defaultPositions.rank.y}" 
            font-size="${defaultPositions.rank.fontSize}" 
            font-weight="${defaultPositions.rank.weight}"
            fill="${defaultPositions.rank.color}" 
            style="letter-spacing: ${defaultPositions.rank.letterSpacing}px">${rank}위</text>` : ''}
          <text 
            x="${width * (defaultPositions.title.startX + defaultPositions.title.endX) / 2}" 
            y="${height * defaultPositions.title.y}" 
            font-size="${defaultPositions.title.fontSize}" 
            font-weight="${defaultPositions.title.weight}"
            fill="${defaultPositions.title.color}"
            text-anchor="middle"
            style="letter-spacing: ${defaultPositions.title.letterSpacing}px">${videoTitle}</text>
          ${nameTextSvg}
          ${(discountRate && discountRate > 0) ? `<text 
            x="${width * defaultPositions.price.x}" 
            y="${height * defaultPositions.price.y}" 
            fill="${defaultPositions.price.color}"
            font-weight="${defaultPositions.price.weight}"
            font-size="${defaultPositions.price.fontSize}"
            style="letter-spacing: ${defaultPositions.price.letterSpacing}px">가격: ${price}원 (${discountRate}% 할인 중)</text>
          ` : `<text 
            x="${width * defaultPositions.price.x}" 
            y="${height * defaultPositions.price.y}" 
            fill="${defaultPositions.price.color}"
            font-weight="${defaultPositions.price.weight}"
            font-size="${defaultPositions.price.fontSize}"
            style="letter-spacing: ${defaultPositions.price.letterSpacing}px">가격: ${price}원</text>
          `}
         ${rating ? `
          <text 
            x="${width * defaultPositions.rating.x}" 
            y="${height * defaultPositions.rating.y}" 
            fill="${defaultPositions.rating.color}"
            font-weight="${defaultPositions.rating.weight}"
            font-size="${defaultPositions.rating.fontSize}"
            style="letter-spacing: ${defaultPositions.rating.letterSpacing}px">평점: </text>
          ${generateStarRating(rating, 
            width * defaultPositions.rating.x + 80,
            height * defaultPositions.rating.y - 25
          )}
          <text 
            x="${width * defaultPositions.rating.x + 280}"
            y="${height * defaultPositions.rating.y}" 
            fill="${defaultPositions.rating.color}"
            font-weight="${defaultPositions.rating.weight}"
            font-size="${defaultPositions.rating.fontSize}"
            style="letter-spacing: ${defaultPositions.rating.letterSpacing}px">(${ratingCount}개 상품평)</text>
        ` : ''}
          ${features ? `<text 
            x="${width * defaultPositions.features.x}" 
            y="${height * defaultPositions.features.y}" 
            fill="${defaultPositions.features.color}"
            font-weight="${defaultPositions.features.weight}"
            font-size="${defaultPositions.features.fontSize}"
            style="letter-spacing: ${defaultPositions.features.letterSpacing}px">특징: ${features}</text>
          ` : ''}
         ${isRocket ?`<text 
          x="${width * defaultPositions.isNextDayDelivery.x}" 
          y="${height * defaultPositions.isNextDayDelivery.y}" 
          fill="${defaultPositions.isNextDayDelivery.color}"
          font-weight="${defaultPositions.isNextDayDelivery.weight}"
          font-size="${defaultPositions.isNextDayDelivery.fontSize}"
          style="letter-spacing: ${defaultPositions.isNextDayDelivery.letterSpacing}px">오늘사면 내일도착</text>
          <text 
          x="${width * defaultPositions.isRocket.x}" 
          y="${height * defaultPositions.isRocket.y}" 
          fill="${defaultPositions.isRocket.color}"
          font-weight="${defaultPositions.isRocket.weight}"
          font-size="${defaultPositions.isRocket.fontSize}"
          style="letter-spacing: ${defaultPositions.isRocket.letterSpacing}px">로켓 배송</text>
          ` : ''}
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
   * @param outputDir 결과 이미지를 저장할 디렉토리 경로
   * @returns 생성된 이미지 파일 경로 배열
   */
  static async createMultipleProductImages(
    videoTitle: string,
    productsList: {
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
      discountRate?: number;
    }[],
    // backgroundTemplatePath: string,
    outputDir = path.join(process.cwd(), 'output_images')
  ) {
    console.log('🖼️ === ImageProcessor: createMultipleProductImages 시작 ===');
    console.log('📝 비디오 제목:', videoTitle);
    console.log('📊 상품 개수:', productsList.length);
    console.log('📂 출력 디렉터리:', outputDir);
    
    console.log('📋 ImageProcessor에서 받은 상품 목록:');
    productsList.forEach((product, index) => {
      console.log(`${index + 1}. [${product.rank}위] ${product.productName}`);
    });
    
    const outputPaths = [];
    const tempDir = path.join(homedir(), 'temp_images');

    try {
      // 임시 디렉토리 생성
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('📁 임시 디렉터리 생성:', tempDir);
      }

      // 출력 디렉토리 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('📁 출력 디렉터리 생성:', outputDir);
      }

      // 각 상품에 대해 이미지 생성
      console.log('🔄 이미지 생성 시작...');
      for (let i = 0; i < productsList.length; i++) {
        const product = productsList[i];
        const uniqueId = uuidv4();
        
        console.log(`🖼️ [${i + 1}/${productsList.length}] ${product.rank}위 상품 이미지 생성 중: ${product.productName}`);
        const finalOutputPath = path.join(outputDir, `product_image_${uniqueId}.png`);
        const tempOutputPath = path.join(tempDir, `product_image_${i + 1}_temp.png`);

        await this.addTextToImage(
          tempOutputPath,
          product.productImage,
          videoTitle,
          product.productName,
          product.productPrice.toLocaleString(),
          i + 1, // 사용자가 변경한 순서 사용 (배열 인덱스 + 1)
          product.isRocket || false,
          product.discountRate || 0,
          product.rating || 0,
          product.ratingCount || 0,
          product.features || ''
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

  static async testImageGeneration() {
    try {
      const testData = {
        videoTitle: "테스트 비디오 제목",
        productInfo: {
          productName: "테스트 상품명 입니다 길게 써볼게요 과연 어떻게 될까요?",
          productImage: "https://thumbnail7.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/1366566669湲몃떎.jpg", // 실제 이미지 URL로 변경
          productPrice: "50,000",
          isRocket: true,
          isFreeShipping: true,
          rank: 1
        },
        outputPath: path.join(process.cwd(), 'test_output.png')
      };

      console.log('테스트 시작...');
      console.log('출력 경로:', testData.outputPath);

      await this.addTextToImage(
        testData.outputPath,
        testData.productInfo.productImage,
        testData.videoTitle,
        testData.productInfo.productName,
        testData.productInfo.productPrice,
        testData.productInfo.rank,
        testData.productInfo.isRocket,
      );

      console.log('이미지 생성 완료!');
      console.log('생성된 이미지 경로:', testData.outputPath);
      
      return testData.outputPath;
    } catch (error) {
      console.error('테스트 중 오류 발생:', error);
      throw error;
    }
  }

  static async testCreateMultipleProductImages() {
    try {
      const testData = {
        videoTitle: "인기 주방용품 TOP 3",
        productsList: [
          {
            productName: "스테인레스 프라이팬",
            productImage: "https://ads-partners.coupang.com/image1/aZjOIDnZQLX1dMhZaWJ6FQOGHt73qcMABFezhdDsDk-NjA8IssLulpDvc_m-BXkSAxIJ7T1_THeCV4Ic38i8ZLSzZht3gVL5Ztm80AqDAXkb4KZwVsrKjQUveTZtnihP5p9TUIivA0zqdeGOaN57ArxSZrQHKSd4jYsO5JvS7FRHn0B2-5M_oWF3lXy1mC9QI1Qd8lfYCAQBIKDDHmb9qUasLalk_WY4BhV26xZI7Zg7RCftIsaKxQ9k1ZcLagL3rNZbXhQtALGUuHjvWEOL3TfofrXQfOOALWkt9-qgskO0HapdtUfxxVd2kQ==",
            productPrice: 29900,
            rating: 4.5,
            ratingCount: 1200,
            features: "내구성이 좋은 스테인레스 소재",
            isRocket: true,
            isFreeShipping: true,
            shortUrl: "http://example.com/1",
            rank: 1,
            discountRate : 48
          }
        ],
        outputDir: path.join(process.cwd(), 'test_multiple_images')
      };

      console.log('다중 이미지 생성 테스트 시작...');
      console.log('출력 디렉토리:', testData.outputDir);

      const outputPaths = await this.createMultipleProductImages(
        testData.videoTitle,
        testData.productsList,
        testData.outputDir
      );

      console.log('이미지 생성 완료!');
      console.log('생성된 이미지 경로들:', outputPaths);
      
      return outputPaths;
    } catch (error) {
      console.error('테스트 중 오류 발생:', error);
      throw error;
    }
  }
}