import { contextBridge, ipcRenderer } from 'electron'

// 콘솔 메시지 리스너 등록
ipcRenderer.on('console-message', (_, data) => {
  const { type, args, timestamp } = data;
  (console[type as 'log' | 'error' | 'warn' | 'info'])(`[${timestamp}]`, ...args);
});

const electron = {
    // 비디오 파일 선택 다이얼로그
    selectVideoFile: () => ipcRenderer.invoke('select-video-file'),

    // 이미지 파일 선택 다이얼로그
    selectImageFiles: () => ipcRenderer.invoke('select-image-files'),
  
    // 오디오 파일 선택 다이얼로그
    selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
    
    // 이미지 파일 선택 다이얼로그
    selectImageFile: () => ipcRenderer.invoke('select-image-file'),

    // 디렉토리 선택 다이얼로그
    selectDirectory: () => ipcRenderer.invoke('select-directory'),

    // combineVideosAndImages
    combineVideosAndImages: (
      videoTitle: string,
      introVideo: string,
      outroVideo: string,
      backgroundMusic: string,
      backgroundTemplatePath: string,
      productInfo: any[],
      logoPath: string,
      outputDirectory: string,
      imageDisplayDuration: number
    ) => ipcRenderer.invoke('combine-videos-and-images', videoTitle, introVideo, outroVideo, backgroundMusic, backgroundTemplatePath, 
      productInfo, logoPath, outputDirectory, imageDisplayDuration),
  
    // 비디오 트리밍
    trimVideo: (inputPath: string, outputPath: string, startTime: number, duration: number) => 
      ipcRenderer.invoke('trim-video', inputPath, outputPath, startTime, duration),
    
    // 비디오 형식 변환
    convertVideo: (inputPath: string, outputPath: string, targetFormat: string) => 
      ipcRenderer.invoke('convert-video', inputPath, outputPath, targetFormat),
    
    // 비디오 병합
    mergeVideos: (inputPaths: string[], outputPath: string) => 
      ipcRenderer.invoke('merge-videos', inputPaths, outputPath),

    // 유튜브 업로드
    uploadVideo: (auth: any, title: string, description: string, tags: string[], videoFilePath: string, thumbFilePath: string) => 
      ipcRenderer.invoke('upload-video', auth, title, description, tags, videoFilePath, thumbFilePath),

    // 유튜브 인증 URL 가져오기
    getAuthUrl: () => ipcRenderer.invoke('get-auth-url'),

    // 외부 브라우저 열기
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

    auth: {
      // 기존 auth-callback 이벤트 리스너
      onAuthCallback: (callback: (data: any) => void) => {
        ipcRenderer.removeAllListeners('auth-callback');
        ipcRenderer.on('auth-callback', (_, data) => {
          console.log('Preload: auth-callback received', data);
          callback(data);
        });
      },

      // 기존 google-auth-success 이벤트 리스너
      onGoogleAuthCallback: (callback: (data: any) => void) => {
        ipcRenderer.removeAllListeners('google-auth-success');
        ipcRenderer.on('google-auth-success', (_, data) => {
          console.log('Preload: google-auth-success received', data);
          callback(data);
        });
      },
      
      removeAuthCallback: () => {
        ipcRenderer.removeAllListeners('auth-callback');
        ipcRenderer.removeAllListeners('google-auth-success');
      }
    },

    readFileAsDataUrl: async (filePath: string): Promise<string> => {
      try {
        const result = await ipcRenderer.invoke('read-file-as-data-url', filePath);
        return result;
      } catch (error) {
        console.error('Error reading file:', error);
        throw error;
      }
    },

    // 폴더 열기
    openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
}

contextBridge.exposeInMainWorld('electron', electron)
