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
          productName: string;
          productPrice: string;
          productImage: string;
          isRocket: boolean;
          isCoupon: boolean;
          shortUrl: string;
        }[]
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