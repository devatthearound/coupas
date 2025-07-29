// TypeScript를 사용하는 경우의 Window 인터페이스 확장
declare global {
  interface Window {
    electron: {
      send: (channel: string, ...args: any[]) => void;

      selectVideoFile: () => Promise<string>;
      selectImageFiles: () => Promise<string[]>;
      selectAudioFile: () => Promise<string>;
      selectImageFile: () => Promise<string>;
      selectDirectory: () => Promise<string>;
      combineVideosAndImages: (
        videoTitle: string,
        introVideo: string,
        outroVideo: string,
        backgroundMusic: string,
        backgroundTemplatePath: string,
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
          discountRate?: number;
        }[],
        logoPath: string,
        outputDirectory: string,
        imageDisplayDuration: number,
        fileName?: string
      ) => Promise<{ success: boolean; error?: string, outputPath: string }>;
      uploadVideo: (auth: any, title: string, description: string, tags: string[], videoFilePath: string, thumbFilePath: string) => Promise<{ success: boolean; error?: string, data: any, links: any }>;
      getAuthUrl: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      auth: {
        onAuthCallback: (callback: (data: any) => void) => void;
        onGoogleAuthCallback: (callback: (data: any) => void) => void;
        removeAuthCallback: () => void;
      }
      readFileAsDataUrl: (filePath: string) => Promise<string>;
      openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    }
  }
}

export {};