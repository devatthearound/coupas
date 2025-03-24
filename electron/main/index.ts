import { is } from "@electron-toolkit/utils";
import { getPort } from "get-port-please";
import { startServer } from "next/dist/server/lib/start-server";
import { join } from "path";
import { app, BrowserWindow, ipcMain, dialog, protocol, shell } from 'electron'
import { EnhancedVideoProcessor } from './videoProcessor.js';
import { YouTubeUploader } from './quickstart.js';
import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';

// 기존 console 메서드 캐싱
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// 메인 윈도우 변수
let mainWindow: BrowserWindow | null = null;

// 콘솔 로그 래핑 함수
function wrapConsole() {
  // 메인 윈도우가 존재하는지 확인하고 로그를 렌더러로 전송
  const sendToRenderer = (type: string, ...args: any[]) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const formattedArgs = args.map(arg => {
          if (arg instanceof Error) {
            return { 
              message: arg.message, 
              stack: arg.stack,
              name: arg.name,
              toString: arg.toString()
            };
          }
          return arg;
        });
        
        mainWindow.webContents.send('console-message', {
          type,
          args: formattedArgs,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // 메시지 전송 실패 시 원래 콘솔 메서드 사용
        originalConsole.error('메시지 전송 실패:', e);
      }
    }
    
    // 원래 콘솔 메서드도 호출
    return originalConsole[type as keyof typeof originalConsole](...args);
  };

  // 콘솔 메서드 래핑
  console.log = (...args) => sendToRenderer('log', ...args);
  console.error = (...args) => sendToRenderer('error', ...args);
  console.warn = (...args) => sendToRenderer('warn', ...args);
  console.info = (...args) => sendToRenderer('info', ...args);
}

let port: number;

function setupLogMonitoring(mainWindow: BrowserWindow) {
  const logDir = path.join(app.getPath('userData'), 'logs');
  const logFile = path.join(logDir, 'middleware.log');

  // 로그 디렉토리가 없으면 생성
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 로그 파일이 없으면 생성
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }

  // 로그 파일 모니터링
  fs.watch(logFile, (eventType) => {
    if (eventType === 'change') {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      const newLines = lines.slice(-1); // 마지막 라인만 가져오기

      newLines.forEach(line => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('console-message', {
            type: 'log',
            args: [`[Middleware] ${line}`],
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  });
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      setupLogMonitoring(mainWindow);  // 로그 모니터링 설정
      // 콘솔 래핑 초기화
      wrapConsole();
      console.log("메인 프로세스 콘솔 리디렉션이 활성화되었습니다.");
    }
  });

  const loadURL = async () => {
    if (is.dev) {
      mainWindow?.loadURL("http://localhost:3000");
    } else {
      try {
        port = await startNextJSServer();
        console.log("Next.js server started on port:", port);
        mainWindow?.loadURL(`http://localhost:${port}`);
      } catch (error) {
        console.error("Error starting Next.js server:", error);
      }
    }
  };

  loadURL();
  return mainWindow;
};

const startNextJSServer = async () => {
  try {
    const nextJSPort = await getPort({ portRange: [30_011, 50_000] });
    const webDir = join(app.getAppPath(), "app");

    await startServer({
      dir: webDir,
      isDev: false,
      hostname: "localhost",
      port: nextJSPort,
      customServer: true,
      allowRetry: false,
      keepAliveTimeout: 5000,
    });

    return nextJSPort;
  } catch (error) {
    console.error("Error starting Next.js server:", error);
    throw error;
  }
};

app.whenReady().then(() => {
  // windows/linux 프로토콜 등록Windows와 Linux에서 사용되는 프로토콜 핸들러
  protocol.handle('coupas-auth', async (request) => {
    try {
      const [protocol, fullPath] = request.url.split('://');
      console.log('URL:', request.url);
      console.log('Protocol:', protocol);
      console.log('Path:', fullPath);

      // path와 query 분리
      const [path] = fullPath.split('?');
      
      if (path === 'login') {
        const tempUrl = new URL(`http://temp.com?${fullPath.split('?')[1]}`);
        const accessToken = tempUrl.searchParams.get('coupas_access_token');
        const refreshToken = tempUrl.searchParams.get('coupas_refresh_token');
        
        if (mainWindow) {
          mainWindow.webContents.send('auth-callback', { accessToken, refreshToken });
          mainWindow.focus();
        }
      } else if (path === 'google-auth/success') {
        if (mainWindow) {
          mainWindow.webContents.send('google-auth-success');
          mainWindow.focus();
        }
      }
    } catch (error) {
      console.error('프로토콜 처리 중 오류:', error);
    }
    
    return new Response('인증 처리 중...');
  });

  // macOS 전용 URL 스킴 핸들러
  app.on('open-url', (event, url) => {
    event.preventDefault();
    try {
      const [protocol, fullPath] = url.split('://');
      console.log('URL:', url);
      console.log('Protocol:', protocol);
      console.log('Path:', fullPath);

      // path와 query 분리
      const [path] = fullPath.split('?');
      
      if (path === 'login') {
        const tempUrl = new URL(`http://temp.com?${fullPath.split('?')[1]}`);
        const accessToken = tempUrl.searchParams.get('coupas_access_token');
        const refreshToken = tempUrl.searchParams.get('coupas_refresh_token');
        
        if (mainWindow) {
          mainWindow.webContents.send('auth-callback', { accessToken, refreshToken });
          mainWindow.focus();
        }
      }else if (path === 'google-auth/success') {
        if (mainWindow) {
          mainWindow.webContents.send('google-auth-success');
          mainWindow.focus();
        }
      }
    } catch (error) {
      console.error('URL 스킴 처리 중 오류:', error);
    }
  });


  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})


ipcMain.handle('select-video-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }]
  })
  return result.filePaths[0]
})

ipcMain.handle('select-image-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
  })
  return result.filePaths
})

ipcMain.handle('select-image-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
  })
  return result.filePaths[0]
})

ipcMain.handle('select-audio-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'm4a'] }]
  })
  return result.filePaths[0]
})

ipcMain.handle('combine-videos-and-images', async (
  event,
  videoTitle,
  introVideo,
  outroVideo,
  backgroundMusic,
  backgroundTemplatePath,
  productInfo
) => {
  try {
    console.log('비디오 합성 요청 받음:', {
      videoTitle,
      introVideo,
      outroVideo,
      backgroundMusic,
      backgroundTemplatePath,
      productInfoCount: Array.isArray(productInfo) ? productInfo.length : 'Not an array'
    });
    
    // 파일 존재 여부 확인
    const checkFile = (path: string, name: string) => {
      if (!path) {
        throw new Error(`${name} 경로가 비어있습니다.`);
      }
      if (!fs.existsSync(path)) {
        throw new Error(`${name} 파일을 찾을 수 없습니다: ${path}`);
      }
      return true;
    };
    
    // 필수 파일들 체크
    checkFile(introVideo, '인트로 비디오');
    checkFile(outroVideo, '아웃로 비디오');
    checkFile(backgroundMusic, '배경 음악');
    
    // 배경 템플릿 이미지는 선택적일 수 있음
    if (backgroundTemplatePath && !fs.existsSync(backgroundTemplatePath)) {
      console.warn(`배경 템플릿 이미지를 찾을 수 없습니다: ${backgroundTemplatePath}`);
    }
    
    const result = await EnhancedVideoProcessor.combineVideosAndImages(
      videoTitle,
      introVideo,
      outroVideo,
      backgroundMusic,
      backgroundTemplatePath,
      productInfo
    )
    return result;
  } catch (error) {
    console.error('비디오 합성 중 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }
  }
})

ipcMain.handle('upload-video', async (event, auth, title, description, tags, videoFilePath, thumbFilePath) => {
  try {
    console.log('upload-video 핸들러 호출됨223:', { auth, title, description, tags, videoFilePath, thumbFilePath });
    const result = await YouTubeUploader.uploadVideo(auth, title, description, tags, videoFilePath, thumbFilePath);
    console.log('uploadVideo 결과:', result);
    return { success: true };
  } catch (error) {
    console.log('upload-video 핸들러에서 오류 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
})

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('read-file-as-data-url', async (_, filePath) => {
  try {
    const buffer = await readFile(filePath);
    const base64 = buffer.toString('base64');
    return `data:video/mp4;base64,${base64}`;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});