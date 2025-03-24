'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { isElectron } from '@/utils/environment';
import toast from 'react-hot-toast';

function RedirectContent() {
  const searchParams = useSearchParams();
  const [_isElectron, setIsElectron] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user, fetchUser } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    const url = searchParams.get('url');
    if (url && window.electron?.openExternal) {
      window.electron.openExternal(url);
    }
  }, [searchParams]);

  useEffect(() => {
    const isElectronEnv = isElectron();
    setIsElectron(isElectronEnv);

    // Electron 환경에서만 이벤트 리스너 설정
    if (isElectronEnv) {
      window.electron.auth.onAuthCallback((data) => {
        console.log("Auth callback received:", data);
        setIsAuthenticating(true);
        const { accessToken, refreshToken } = data;
        
        if (accessToken && refreshToken) {
          // 토큰을 쿠키에 저장하는 API 호출
          fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken, refreshToken }),
          })
          .then(async response => {
            if (response.ok) {
              setIsAuthenticating(false);
              await fetchUser(); // 사용자 정보 가져오기를 기다림
              window.location.href = '/'; // 이렇게 하면 서버 측에서 쿠키를 인식함
            } else {
              console.error('Failed to set cookies');
              setIsAuthenticating(false);
              toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
              window.location.href = '/'; // 이렇게 하면 서버 측에서 쿠키를 인식함
            }
          })
          .catch(err => {
            console.error('Error setting cookies:', err);
            setIsAuthenticating(false);
            toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
            window.location.href = '/'; // 이렇게 하면 서버 측에서 쿠키를 인식함
          });
        } else {
          setIsAuthenticating(false);
          toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
          window.location.href = '/'; // 이렇게 하면 서버 측에서 쿠키를 인식함
        }
      });
    }

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      if (isElectronEnv) {
        window.electron.auth.removeAuthCallback();
      }
    };
  }, [fetchUser]);


  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">로그인 진행 중</h2>
          
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
          
          <p className="text-center mb-4">
            외부 웹사이트에서 로그인이 진행 중입니다.
            <br />
            웹 브라우저가 열리지 않았다면 아래 버튼을 클릭하세요.
          </p>
          
          <div className="text-center">
            <button 
              onClick={() => {
                // 로그인 페이지 수동 열기
                const loginUrl = `https://growsome.kr/login?redirect_to=${encodeURIComponent('coupas-auth://login')}`;
                window.electron.openExternal(loginUrl);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              로그인 페이지 열기
            </button>
          </div>
        </div>
      </div>
    ); 
}

export default function ExternalRedirect() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RedirectContent />
    </Suspense>
  );
} 