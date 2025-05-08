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
import { autoUpdater } from 'electron-updater';
import { TemplateStore, VideoTemplate } from "./templateStore.js";

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

/**
 * 자동 업데이트 설정
 */
function setupAutoUpdater() {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서는 업데이트 비활성화
    return;
  }

  // 로그 설정
  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // 업데이트 이벤트 리스너
  autoUpdater.on('checking-for-update', () => {
    console.log('업데이트 확인 중...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('업데이트 가능');
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('업데이트 없음');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `다운로드 속도: ${progressObj.bytesPerSecond}`;
    logMessage = `${logMessage} - 다운로드: ${Math.round(progressObj.percent)}%`;
    logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
    
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('업데이트 다운로드 완료:');
    
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
      
      // 사용자에게 업데이트 설치 확인 다이얼로그 표시
      dialog.showMessageBox({
        type: 'info',
        title: '업데이트 준비 완료',
        message: `새 버전 ${info.version}이(가) 다운로드되었습니다. 지금 재시작하여 업데이트를 설치하시겠습니까?`,
        buttons: ['예', '아니오']
      }).then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('자동 업데이트 오류:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err);
    }
  });

  // 업데이트 확인 시작 (시작 시 그리고 매 2시간마다)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
    
    // 정기적인 업데이트 확인 (2시간마다)
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 2 * 60 * 60 * 1000);
  }, 10000); // 앱 시작 10초 후 첫 검사
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
    }
  });

  const loadURL = async () => {
    if (is.dev) {
      mainWindow?.loadURL("http://localhost:3000");
    } else {
      try {
        port = await startNextJSServer();
        mainWindow?.loadURL(`http://localhost:${port}`);
      } catch (error) {
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
    throw error;
  }
};

app.whenReady().then(() => {
  // 프로토콜 등록을 더 일찍 수행
  if (!app.isDefaultProtocolClient('coupas-auth')) {
    app.setAsDefaultProtocolClient('coupas-auth');
  }

  protocol.handle('coupas-auth', async (request) => {
    try {
      const url = new URL(request.url);
      
      if (url.pathname === '/login') {
        const accessToken = url.searchParams.get('coupas_access_token');
        const refreshToken = url.searchParams.get('coupas_refresh_token');
                
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth-callback', { 
            accessToken, 
            refreshToken 
          });
          mainWindow.focus();
          return new Response('인증 성공');
        }
      }

      if (url.pathname === '/google-auth/success' || url.pathname === 'google-auth/success') {
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

  // macOS를 위한 추가 처리
  app.on('open-url', (event, url) => {
    event.preventDefault();
    try {
      // URL 정규화
      const normalizedUrl = url.replace('coupas-auth://', 'coupas-auth:///');
      const parsedUrl = new URL(normalizedUrl);
            // pathname이 /login 또는 login인 경우를 모두 처리
      if (parsedUrl.protocol === 'coupas-auth:' && 
          (parsedUrl.pathname === '/login' || parsedUrl.pathname === 'login')) {
        const accessToken = parsedUrl.searchParams.get('coupas_access_token');
        const refreshToken = parsedUrl.searchParams.get('coupas_refresh_token');
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth-callback', { 
            accessToken, 
            refreshToken 
          });
          mainWindow.focus();
        }
      }

      if (parsedUrl.protocol === 'coupas-auth:' && 
          (parsedUrl.pathname === '/google-auth/success' || parsedUrl.pathname === 'google-auth/success')) {
        if (mainWindow) {
          mainWindow.webContents.send('google-auth-success');
          mainWindow.focus();
        }
      }
    } catch (error) {
      console.error('URL 파싱 중 오류:', error);
    }
  });
  

  createWindow().then(() => {
    // 자동 업데이트 설정
    setupAutoUpdater();
  });


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
// 디렉토리 선택 다이얼로그
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
}); 

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
  productInfo,
  logoPath,
  outputDirectory,
  imageDisplayDuration
) => {
  try {
    console.log('비디오 합성 요청 받음:', {
      videoTitle,
      introVideo, 
      outroVideo,
      backgroundMusic,
      backgroundTemplatePath,
      productInfoCount: Array.isArray(productInfo) ? productInfo.length : 'Not an array',
      logoPath,
      outputDirectory,
      imageDisplayDuration
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
    
    // // 배경 템플릿 이미지는 선택적일 수 있음
    // if (backgroundTemplatePath && !fs.existsSync(backgroundTemplatePath)) {
    //   console.warn(`배경 템플릿 이미지를 찾을 수 없습니다: ${backgroundTemplatePath}`);
    // }
    
    const result = await EnhancedVideoProcessor.combineVideosAndImages(
      videoTitle,
      introVideo,
      outroVideo,
      backgroundMusic,
      // backgroundTemplatePath,
      productInfo,
      logoPath,
      outputDirectory,
      imageDisplayDuration
    )
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }
  }
})

ipcMain.handle('upload-video', async (event, auth, title, description, tags, videoFilePath, thumbFilePath) => {
  try {
    const result = await YouTubeUploader.uploadVideo(auth, title, description, tags, videoFilePath, thumbFilePath);
    return result;
  } catch (error) {
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
    throw error;
  }
});

// 싱글 인스턴스 보장
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // URL 프로토콜로 실행된 경우 처리
      const protocolUrl = commandLine.find(arg => arg.startsWith('coupas-auth://'));
      if (protocolUrl) {
        try {
          const url = new URL(protocolUrl);
          const accessToken = url.searchParams.get('coupas_access_token');
          const refreshToken = url.searchParams.get('coupas_refresh_token');
          
          mainWindow.webContents.send('auth-callback', { 
            accessToken, 
            refreshToken 
          });
        } catch (error) {
          console.error('URL 파싱 중 오류:', error);
        }
      }
    }
  });
}

// 폴더 열기 핸들러 추가
ipcMain.handle('open-folder', async (_, folderPath) => {
  try {
    // 폴더가 존재하는지 확인
    if (!fs.existsSync(folderPath)) {
      throw new Error('폴더를 찾을 수 없습니다.');
    }
    
    // 운영체제별로 적절한 방법으로 폴더 열기
    if (process.platform === 'darwin') {
      // macOS
      await shell.openPath(folderPath);
    } else if (process.platform === 'win32') {
      // Windows
      await shell.openPath(folderPath);
    } else {
      // Linux 등 기타 운영체제
      await shell.openPath(folderPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('폴더 열기 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '폴더를 열 수 없습니다.' 
    };
  }
});

// 여기서부터 템플릿 관련 IPC 핸들러 추가 (기존 ipcMain 핸들러들 아래에 추가)

// 템플릿 목록 조회
ipcMain.handle('get-templates', async (event, userId) => {
  try {
    const templates = await TemplateStore.getTemplates(userId);
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 단일 템플릿 조회
ipcMain.handle('get-template', async (event, templateId, userId) => {
  try {
    const template = await TemplateStore.getTemplate(templateId, userId);
    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 기본 템플릿 조회
ipcMain.handle('get-default-template', async (event, userId) => {
  try {
    const template = await TemplateStore.getDefaultTemplate(userId);
    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 마지막 사용 템플릿 조회
ipcMain.handle('get-last-used-template', async (event, userId) => {
  try {
    const template = await TemplateStore.getLastUsedTemplate(userId);
    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 템플릿 저장
ipcMain.handle('save-template', async (event, template: VideoTemplate) => {
  try {
    const templateId = await TemplateStore.createTemplate(template);
    return { success: true, data: { id: templateId } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 템플릿 업데이트
ipcMain.handle('update-template', async (event, templateId: number, template: Partial<VideoTemplate>) => {
  try {
    const success = await TemplateStore.updateTemplate(templateId, template);
    return { success };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 템플릿 삭제
ipcMain.handle('delete-template', async (event, templateId: number, userId: number) => {
  try {
    const success = await TemplateStore.deleteTemplate(templateId, userId);
    return { success };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});

// 템플릿 사용 업데이트
ipcMain.handle('update-template-usage', async (event, templateId: number, userId: number) => {
  try {
    const success = await TemplateStore.updateTemplateUsage(templateId, userId);
    return { success };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
});