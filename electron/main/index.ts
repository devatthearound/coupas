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
// import { autoUpdater } from 'electron-updater'; // 임시로 주석 처리
import { TemplateStore, VideoTemplate } from "./templateStore.js";

console.log("일렉트론 메인 프로세스가 시작되었습니다.");

// Electron 환경 설정
const isDev = process.env.NODE_ENV === 'development';

// 기존 console 메서드 캐싱
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// 메인 윈도우 변수
let mainWindow: BrowserWindow | null = null;
let isCreatingWindow = false;
let isServerStarted = false;

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
  // 자동 업데이트 완전 비활성화 (코드 서명 문제 해결 후 재활성화)
  console.log('자동 업데이트 완전 비활성화됨 (코드 서명 문제 해결 중)');
  return;
  
  /*
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서는 업데이트 비활성화
    return;
  }

  autoUpdater.logger = console;

  // Windows 전용 설정
  if (process.platform === 'win32') {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'devatthearound',
      repo: 'coupas',
      token: process.env.GH_TOKEN,
      private: false,
      channel: 'latest',
      // Windows 전용 설정
      updaterCacheDirName: 'coupas-updater',
      requestHeaders: {
        'User-Agent': 'coupas-updater'
      }
    });
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  
  // 코드 서명 검증 완전 비활성화
  autoUpdater.disableWebInstaller = true;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  
  // 코드 서명 검증 비활성화 (macOS)
  if (process.platform === 'darwin') {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
  }

  // 업데이트 이벤트 리스너
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
      // Windows에서는 수동으로 다운로드 시작
      if (process.platform === 'win32') {
        autoUpdater.downloadUpdate();
      }
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'not-available');
    }
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
    console.log('업데이트 다운로드 완료:', info.version);
    
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
      
      // 팝업 없이 자동 설치 (3초 후)
      setTimeout(() => {
        console.log('자동 업데이트 설치 시작...');
        if (process.platform === 'win32') {
          autoUpdater.quitAndInstall(false, true);
        } else {
          autoUpdater.quitAndInstall();
        }
      }, 3000);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('자동 업데이트 오류:', err);
    
    // 코드 서명 오류인 경우 무시하고 계속 진행
    if (err.message && err.message.includes('Code signature')) {
      console.log('코드 서명 오류 무시하고 계속 진행...');
      return;
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err);
    }
  });

  // 업데이트 확인 시작 (시작 시 그리고 매 2시간마다)
  setTimeout(() => {
  autoUpdater.checkForUpdatesAndNotify();
  }, 10000); // 앱 시작 10초 후 첫 검사
  */
}

// 수동 업데이트 확인 함수 (개발자용)
function checkForUpdatesManually() {
  console.log('수동 업데이트 확인 시작...');
  
  // GitHub에서 최신 릴리즈 정보 가져오기
  fetch('https://api.github.com/repos/devatthearound/coupas/releases/latest')
    .then(response => response.json())
    .then(data => {
      console.log('최신 버전 정보:', data.tag_name);
      
      if (mainWindow) {
        mainWindow.webContents.send('manual-update-info', {
          version: data.tag_name,
          downloadUrl: data.html_url,
          body: data.body
        });
      }
    })
    .catch(error => {
      console.error('수동 업데이트 확인 실패:', error);
    });
}

const createWindow = async () => {
  console.log("createWindow 호출됨 - 스택:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
  
  if (isCreatingWindow) {
    console.log("윈도우 생성이 이미 진행 중입니다.");
    return mainWindow;
  }
  
  isCreatingWindow = true;
  console.log("윈도우 생성을 시작합니다...");
  
  try {
    mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'default',
    title: '쿠파스 - 제휴영상 만들기',
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false, // 보안을 위해 false로 변경
      contextIsolation: true, // contextBridge 사용을 위해 true로 변경
      webSecurity: false, // 로컬 파일 접근을 위해 필요
      allowRunningInsecureContent: true,
    },
    show: false, // 처음에는 숨겨진 상태로 생성
  });

  console.log("윈도우가 생성되었습니다.");

  mainWindow.on("ready-to-show", () => {
    console.log("윈도우가 표시될 준비가 되었습니다.");
    if (mainWindow) {
      mainWindow.show();
      mainWindow.setTitle('쿠파스 - 제휴영상 만들기');
      setupLogMonitoring(mainWindow);  // 로그 모니터링 설정
      // 콘솔 래핑 초기화
      wrapConsole();
      console.log("메인 프로세스 콘솔 리디렉션이 활성화되었습니다.");
      
      // 개발 모드에서 개발자 도구 자동 열기
      if (is.dev) {
        console.log("개발 모드: 개발자 도구를 엽니다.");
        mainWindow.webContents.openDevTools();
      }
    }
  });

  mainWindow.on("closed", () => {
    console.log("메인 윈도우가 닫혔습니다.");
    mainWindow = null;
  });

  const loadURL = async () => {
    console.log("URL 로딩을 시작합니다...");
    if (is.dev) {
      console.log("개발 모드: Next.js 서버에 연결합니다.");
      // 개발 모드에서 사용 가능한 포트 찾기
      const devPorts = [3000, 3001, 3002, 3003];
      
      for (const port of devPorts) {
        try {
          console.log(`포트 ${port}로 연결 시도...`);
          await mainWindow?.loadURL(`http://localhost:${port}`);
          console.log(`포트 ${port} 연결 성공`);
          return;
        } catch (error) {
          console.error(`포트 ${port} 연결 실패:`, error);
          continue;
        }
      }
      
      console.error("모든 포트 연결 실패");
    } else {
      try {
        port = await startNextJSServer();
        console.log("Next.js server started on port:", port);
        await mainWindow?.loadURL(`http://localhost:${port}`);
        console.log("프로덕션 서버 연결 성공");
      } catch (error) {
      }
    }
  };

  await loadURL();
  return mainWindow;
  } catch (error) {
    console.error("윈도우 생성 중 오류 발생:", error);
    isCreatingWindow = false;
    throw error;
  } finally {
    isCreatingWindow = false;
  }
};

const startNextJSServer = async () => {
  if (isServerStarted) {
    console.log('서버가 이미 시작되었습니다.');
    return 30011; // 기본 포트 반환
  }
  
  try {
    const nextJSPort = await getPort({ portRange: [30_011, 50_000] });
    const webDir = join(app.getAppPath(), "app");

    console.log(`Next.js 서버 시작 시도: ${webDir} on port ${nextJSPort}`);

    await startServer({
      dir: webDir,
      isDev: false,
      hostname: "localhost",
      port: nextJSPort,
      customServer: false,
      allowRetry: true,
      keepAliveTimeout: 5000,
    });

    console.log(`Next.js 서버 시작 성공: port ${nextJSPort}`);
    isServerStarted = true;
    return nextJSPort;
  } catch (error) {
    console.error('Next.js 서버 시작 실패:', error);
    throw error;
  }
};

// Electron 앱 초기화
app.whenReady().then(async () => {
  console.log("Electron 앱이 준비되었습니다.");
  console.log("현재 작업 디렉토리:", process.cwd());
  console.log("앱 경로:", app.getAppPath());
  console.log("실행 파일 경로:", process.execPath);
  
  try {
    await createWindow();
    console.log("메인 윈도우 생성 완료");
  } catch (error) {
    console.error("윈도우 생성 중 오류 발생:", error);
    // 오류가 발생해도 앱이 종료되지 않도록 함
    setTimeout(() => {
      console.log("오류 후 재시도...");
      createWindow().catch(e => {
        console.error("재시도 실패:", e);
        app.quit();
      });
    }, 1000);
  }
  console.log("앱이 준비되었습니다.");
  
  // 프로토콜 등록을 더 일찍 수행
  console.log('🔗 프로토콜 등록 시작...');
  
  // 기존 등록 확인
  const isAlreadyDefault = app.isDefaultProtocolClient('coupas-auth');
  console.log('📋 현재 프로토콜 등록 상태:', isAlreadyDefault);
  
  if (!isAlreadyDefault) {
    const success = app.setAsDefaultProtocolClient('coupas-auth');
    console.log('🎯 프로토콜 등록 시도 결과:', success);
  } else {
    console.log('✅ 프로토콜이 이미 등록되어 있습니다.');
  }
  
  // 수동 업데이트 확인 IPC 핸들러
  ipcMain.handle('check-updates-manually', () => {
    checkForUpdatesManually();
  });

  // 등록 후 재확인
  const finalStatus = app.isDefaultProtocolClient('coupas-auth');
  console.log('🔍 최종 프로토콜 등록 확인:', finalStatus);
  
  if (!finalStatus) {
    console.error('❌ 프로토콜 등록 실패! macOS에서 수동 등록이 필요할 수 있습니다.');
  }

  protocol.handle('coupas-auth', async (request) => {
    try {
      console.log('🔗 프로토콜 콜백 수신:', request.url);
      const url = new URL(request.url);
      console.log('📍 프로토콜 패스:', url.pathname);
      console.log('🔍 URL 파라미터:', url.searchParams.toString());
      
      if (url.pathname === '/login') {
        const accessToken = url.searchParams.get('coupas_access_token');
        const refreshToken = url.searchParams.get('coupas_refresh_token');
        
        console.log('🔑 받은 토큰:', {
          accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
          refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null
        });
                
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('📨 메인 윈도우에 auth-callback 이벤트 전송');
          mainWindow.webContents.send('auth-callback', { 
            accessToken, 
            refreshToken 
          });
          mainWindow.focus();
          return new Response('인증 성공');
        } else {
          console.error('❌ 메인 윈도우가 없거나 파괴됨');
        }
      } else if (url.pathname === '/google-auth/success') {
        const googleToken = url.searchParams.get('google_token');
        const accessToken = url.searchParams.get('access_token');
        
        console.log('구글 인증 성공:', { googleToken, accessToken });
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('google-auth-success', { 
            googleToken, 
            accessToken,
            success: true 
          });
          mainWindow.focus();
          return new Response('구글 인증 성공');
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
    console.log('🍎 macOS open-url 이벤트 수신:', url);
    try {
      // URL 정규화
      const normalizedUrl = url.replace('coupas-auth://', 'coupas-auth:///');
      const parsedUrl = new URL(normalizedUrl);
      console.log('📍 정규화된 URL:', normalizedUrl);
      console.log('🔍 파싱된 패스:', parsedUrl.pathname);
      console.log('📋 파라미터:', parsedUrl.searchParams.toString());
      
      // pathname이 /login 또는 login인 경우를 모두 처리
      if (parsedUrl.protocol === 'coupas-auth:' && 
          (parsedUrl.pathname === '/login' || parsedUrl.pathname === 'login')) {
        const accessToken = parsedUrl.searchParams.get('coupas_access_token');
        const refreshToken = parsedUrl.searchParams.get('coupas_refresh_token');
        
        console.log('🔑 macOS에서 받은 토큰:', {
          accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
          refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null
        });
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('📨 macOS에서 메인 윈도우에 auth-callback 이벤트 전송');
          mainWindow.webContents.send('auth-callback', { 
            accessToken, 
            refreshToken 
          });
          mainWindow.focus();
        } else {
          console.error('❌ macOS: 메인 윈도우가 없거나 파괴됨');
        }
      } else if (parsedUrl.protocol === 'coupas-auth:' && 
                 (parsedUrl.pathname === '/google-auth/success' || parsedUrl.pathname === 'google-auth/success')) {
        const googleToken = parsedUrl.searchParams.get('google_token');
        const accessToken = parsedUrl.searchParams.get('access_token');
        
        console.log('구글 인증 성공 (macOS):', { googleToken, accessToken });
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('google-auth-success', { 
            googleToken, 
            accessToken,
            success: true 
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
    console.log("윈도우 생성이 완료되었습니다.");
    // 자동 업데이트 설정
    setupAutoUpdater();
  }).catch((error) => {
    console.error("윈도우 생성 중 오류:", error);
  });


  app.on("activate", () => {
    console.log('App activated');
    if (BrowserWindow.getAllWindows().length === 0 && !isCreatingWindow) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  console.log("모든 윈도우가 닫혔습니다.");
  if (process.platform !== "darwin") {
    console.log("앱을 종료합니다.");
    app.quit();
  }
});

// 앱 종료 전 이벤트
app.on("before-quit", (event) => {
  console.log("앱이 종료되려고 합니다.");
});

// 앱이 비정상적으로 종료되는 것을 방지
process.on('uncaughtException', (error) => {
  console.error('처리되지 않은 예외:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 Promise 거부:', reason, promise);
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

// 구글 인증 성공 이벤트 핸들러
ipcMain.on('google-auth-success', (event) => {
  console.log('구글 인증 성공 이벤트 수신');
  if (mainWindow && !mainWindow.isDestroyed()) {
    // 메인 윈도우에 구글 인증 성공을 알림
    mainWindow.webContents.send('google-auth-success', { success: true });
    console.log('메인 윈도우에 구글 인증 성공 전송');
  }
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
  imageDisplayDuration,
  fileName
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
      imageDisplayDuration,
      fileName
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
    console.log('🚀 === upload-video IPC 핸들러 호출 ===');
    console.log('📝 제목:', title);
    console.log('📋 설명:', description);
    console.log('🏷️ 태그:', tags);
    console.log('📹 비디오 파일 경로:', videoFilePath);
    console.log('🖼️ 썸네일 파일 경로:', thumbFilePath);
    console.log('🔑 인증 객체 타입:', typeof auth);
    
    const result = await YouTubeUploader.uploadVideo(auth, title, description, tags, videoFilePath, thumbFilePath);
    console.log('✅ YouTubeUploader 결과:', result);
    
    // 결과를 그대로 반환 (success/error 정보 포함)
    return result;
  } catch (error) {
    console.error('❌ upload-video 핸들러에서 오류 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
})

ipcMain.handle('open-external', async (_, url) => {
  console.log('🌐 External URL 열기 요청:', url);
  try {
    await shell.openExternal(url);
    console.log('✅ External URL 열기 성공:', url);
  } catch (error) {
    console.error('❌ External URL 열기 실패:', error);
    throw error;
  }
});

ipcMain.handle('read-file-as-data-url', async (_, filePath) => {
  try {
    console.log('파일 읽기 시도:', filePath);
    
    // 파일 존재 여부 확인
    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일이 존재하지 않습니다: ${filePath}`);
    }
    
    const buffer = await readFile(filePath);
    console.log('파일 크기:', buffer.length, 'bytes');
    
    // 파일 크기 제한 (100MB)
    if (buffer.length > 100 * 1024 * 1024) {
      throw new Error('파일이 너무 큽니다 (100MB 초과)');
    }
    
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;
    console.log('Data URL 생성 완료, 길이:', dataUrl.length);
    
    return dataUrl;
  } catch (error) {
    throw error;
  }
});

// 싱글 인스턴스 보장 (개발 모드에서는 비활성화)
if (!isDev) {
  console.log("싱글 인스턴스 잠금을 요청합니다...");
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    console.log("앱이 이미 실행 중입니다. 종료합니다.");
    app.quit();
  } else {
    console.log("싱글 인스턴스 잠금을 획득했습니다.");
  }
} else {
  console.log("개발 모드: 싱글 인스턴스 잠금을 비활성화합니다.");
}

app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    
    // URL 프로토콜로 실행된 경우 처리
    const protocolUrl = commandLine.find(arg => arg.startsWith('coupas-auth://'));
    if (protocolUrl) {
      try {
        const url = new URL(protocolUrl);
        
        if (url.pathname.includes('google-auth/success')) {
          const googleToken = url.searchParams.get('google_token');
          const accessToken = url.searchParams.get('access_token');
          
          mainWindow.webContents.send('google-auth-success', { 
            googleToken, 
            accessToken,
            success: true 
          });
        } else if (url.pathname.includes('login')) {
          const accessToken = url.searchParams.get('coupas_access_token');
          const refreshToken = url.searchParams.get('coupas_refresh_token');
          
          mainWindow.webContents.send('auth-callback', { 
            accessToken, 
            refreshToken 
          });
        }
      } catch (error) {
        console.error('URL 파싱 중 오류:', error);
      }
    }
  }
});

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