'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
// import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./contexts/UserContext";
import toast, { Toaster } from "react-hot-toast";
import Navbar from './components/Navbar';
import { FormatModal, ApiModal, YoutubeModal } from './components/Modals';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isYoutubeLoggedIn, setIsYoutubeLoggedIn] = useState(false);
  const [apiConfigUpdateTrigger, setApiConfigUpdateTrigger] = useState(0); // API 설정 업데이트 트리거

  // API 설정 저장 후 네비게이션 상태 업데이트
  const handleApiConfigSaved = () => {
    setApiConfigUpdateTrigger(prev => prev + 1);
  };

  // 유튜브 로그인 상태 확인 함수
  const checkYoutubeLoginStatus = async () => {
    try {
      const response = await fetch('/api/google-auth/token');
      if (response.ok) {
        setIsYoutubeLoggedIn(true);
      } else {
        setIsYoutubeLoggedIn(false);
      }
    } catch (error) {
      console.log('유튜브 로그인 상태 확인 중 오류:', error);
      setIsYoutubeLoggedIn(false);
    }
  };

  // 페이지 로드 시 유튜브 로그인 상태 확인
  useEffect(() => {
    checkYoutubeLoginStatus();
  }, []);

  // 유튜브 모달이 열릴 때마다 상태 재확인
  useEffect(() => {
    if (isYoutubeModalOpen) {
      checkYoutubeLoginStatus();
    }
  }, [isYoutubeModalOpen]);

  useEffect(() => {
    // Electron 환경에서만 실행
    if (typeof window !== 'undefined' && window.electron) {
      // 업데이트 가능 알림
      const handleUpdateAvailable = (info: any) => {
        toast(`새 버전(${info.version})이 있습니다. 다운로드 중...`, {
          icon: 'ℹ️',
          duration: 4000
        });
      };
      
      // 다운로드 진행 상황
      const handleDownloadProgress = (progress: any) => {
        console.log(`업데이트 다운로드 중: ${Math.round(progress.percent)}%`);
      };
      
      // 다운로드 완료
      const handleUpdateDownloaded = (info: any) => {
        toast.success(`새 버전(${info.version})이 준비되었습니다. 재시작시 적용됩니다.`);
      };
      
      // 오류 처리
      const handleUpdateError = (err: any) => {
        toast.error(`업데이트 오류: ${err.message}`);
      };
      
      // 이벤트 리스너 추가
      window.electron.on('update-available', handleUpdateAvailable);
      window.electron.on('download-progress', handleDownloadProgress);
      window.electron.on('update-downloaded', handleUpdateDownloaded);
      window.electron.on('update-error', handleUpdateError);
      
      // 컴포넌트 언마운트 시 이벤트 리스너 정리
      return () => {
        if (window.electron) {
          window.electron.removeAllListeners('update-available');
          window.electron.removeAllListeners('download-progress');
          window.electron.removeAllListeners('update-downloaded');
          window.electron.removeAllListeners('update-error');
        }
      };
    }
  }, []);
  
  return (
    <html lang="en" className="w-full h-full">
      <body
        className={`flex flex-col w-full h-full bg-gray-50 overflow-hidden ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <div className={isLandingPage ? "min-h-screen bg-white" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
            <Toaster position="bottom-center" />
            <Navbar
              onFormatModalOpen={() => setIsFormatModalOpen(true)}
              onApiModalOpen={() => setIsApiModalOpen(true)}
              onYoutubeLoginOpen={() => setIsYoutubeModalOpen(true)}
              isYoutubeLoggedIn={isYoutubeLoggedIn}
              currentPage={pathname === '/' ? 'home' : 'search'}
              apiConfigUpdateTrigger={apiConfigUpdateTrigger}
            />
            <FormatModal 
              isOpen={isFormatModalOpen} 
              onClose={() => setIsFormatModalOpen(false)} 
            />
            <ApiModal 
              isOpen={isApiModalOpen} 
              onClose={() => setIsApiModalOpen(false)}
              onApiConfigSaved={handleApiConfigSaved}
            />
            <YoutubeModal 
              isOpen={isYoutubeModalOpen} 
              onClose={() => setIsYoutubeModalOpen(false)}
              onYoutubeLogin={(status) => {
                setIsYoutubeLoggedIn(status);
                if (status) {
                  // 로그인 성공 시 추가 상태 업데이트
                  checkYoutubeLoginStatus();
                }
              }}
              isYoutubeLoggedIn={isYoutubeLoggedIn}
            />
            <div className={isLandingPage ? "" : "pt-16"}>
              {children}
            </div>
          </div>
        </UserProvider>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // 개발용 토큰 설정 함수
                window.setDevToken = function(token) {
                  localStorage.setItem('coupas_access_token', token);
                  console.log('토큰이 설정되었습니다. 페이지를 새로고침하세요.');
                  window.location.reload();
                };
                
                // 사용법 출력
                console.log('개발 환경입니다. 다음 명령으로 토큰을 설정할 수 있습니다:');
                console.log('setDevToken("your_token_here")');
                console.log('');
                console.log('개발용 API 키가 자동으로 설정됩니다:');
                console.log('Access Key: 028d1bc3-8dab-43a8-b855-b1f21797b4f0');
                console.log('Secret Key: b51e8cd97285c85c63184be9cb8e038237d8ae14');
              `
            }}
          />
        )}
        </body>
    </html>
  );
}
