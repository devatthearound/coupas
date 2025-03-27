// TypeScript를 사용하는 경우의 Window 인터페이스 확장
declare global {
  interface Window {
    electron: {
      send: (channel: string, ...args: any[]) => void;

      selectVideoFile: () => Promise<string>;
      selectImageFiles: () => Promise<string[]>;
      selectAudioFile: () => Promise<string>;
      selectImageFile: () => Promise<string>;
      combineVideosAndImages: (
        videoTitle: string,
        introVideo: string,
        outroVideo: string,
        backgroundMusic: string,
        backgroundTemplatePath: string,
        productInfo: {
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
        logoPath: string
      ) => Promise<{ success: boolean; error?: string, outputPath: string }>;
      uploadVideo: (auth: any, title: string, description: string, tags: string[], videoFilePath: string, thumbFilePath: string) => Promise<{ success: boolean; error?: string }>;
      getAuthUrl: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      auth: {
        onAuthCallback: (callback: (data: any) => void) => void;
        onGoogleAuthCallback: (callback: (data: any) => void) => void;
        removeAuthCallback: () => void;
      }
      readFileAsDataUrl: (filePath: string) => Promise<string>;
    }
  }
}

export {};