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
    console.log('🔗 External redirect 페이지 로드됨');
    console.log('📎 URL 파라미터:', url);
    console.log('🖥️ Electron 객체 존재:', !!(window as any).electron);
    console.log('🔧 openExternal 함수 존재:', !!(window as any).electron?.openExternal);
    
    if (url) {
      if ((window as any).electron?.openExternal) {
        console.log('✅ Electron에서 외부 URL 열기 시도:', url);
        (window as any).electron.openExternal(url);
      } else {
        console.log('⚠️ Electron 환경이 아니거나 openExternal 함수 없음, 브라우저에서 열기');
        window.open(url, '_blank');
      }
    } else {
      console.log('❌ URL 파라미터가 없습니다');
    }
  }, [searchParams]);

  useEffect(() => {
    const isElectronEnv = isElectron();
    setIsElectron(isElectronEnv);

    // pending 콜백 확인 및 처리
    const pendingCallback = localStorage.getItem('pending-auth-callback');
    if (pendingCallback) {
      console.log('📦 저장된 pending 콜백 발견, 처리 시작...');
      try {
        const tokens = JSON.parse(pendingCallback);
        localStorage.removeItem('pending-auth-callback');
        
        console.log('🔑 Pending 콜백 토큰 처리:', {
          accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : null,
          refreshToken: tokens.refreshToken ? `${tokens.refreshToken.substring(0, 20)}...` : null
        });
        
        // 콜백 처리 로직 실행
        if (tokens.accessToken && tokens.refreshToken) {
          setIsAuthenticating(true);
          
          localStorage.setItem('coupas_access_token', tokens.accessToken);
          console.log('💾 localStorage에 토큰 저장 완료');
          
          fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokens),
          })
          .then(async response => {
            if (response.ok) {
              console.log('✅ Pending 콜백 처리 성공');
              await fetchUser();
              setIsAuthenticating(false);
              window.location.href = '/';
            } else {
              console.error('❌ Pending 콜백 쿠키 설정 실패');
              setIsAuthenticating(false);
              toast.error('로그인 처리에 실패했습니다.');
            }
          })
          .catch(err => {
            console.error('❌ Pending 콜백 처리 오류:', err);
            setIsAuthenticating(false);
            toast.error('로그인 처리에 실패했습니다.');
          });
        }
      } catch (error) {
        console.error('❌ Pending 콜백 파싱 오류:', error);
        localStorage.removeItem('pending-auth-callback');
      }
      return; // pending 콜백 처리 시 아래 로직 건너뛰기
    }

    // Electron 환경에서만 이벤트 리스너 설정
    if (isElectronEnv) {
      console.log('🖥️ Electron 환경에서 인증 콜백 리스너 설정');
      
      // window.electron 객체 확인
      if (!(window as any).electron) {
        console.error('❌ window.electron 객체가 없습니다');
        toast.error('Electron 환경 설정 오류가 발생했습니다.');
        return;
      }
      
      if (!(window as any).electron.auth) {
        console.error('❌ window.electron.auth 객체가 없습니다');
        toast.error('Electron 인증 설정 오류가 발생했습니다.');
        return;
      }
      
      console.log('✅ window.electron.auth 객체 확인됨');
      
      (window as any).electron.auth.onAuthCallback((data: any) => {
        console.log("🎉 Auth callback received:", data);
        setIsAuthenticating(true);
        const { accessToken, refreshToken } = data;
        
        if (accessToken && refreshToken) {
          console.log('🔑 토큰 수신 완료, 쿠키 설정 시작');
          
          // localStorage에도 토큰 저장 (개발 환경 및 빠른 접근을 위해)
          try {
            localStorage.setItem('coupas_access_token', accessToken);
            console.log('💾 localStorage에 토큰 저장 완료');
          } catch (error) {
            console.warn('⚠️ localStorage 저장 실패:', error);
          }
          
          // 토큰을 쿠키에 저장하는 API 호출
          fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken, refreshToken }),
          })
          .then(async response => {
            console.log('🍪 쿠키 설정 API 응답 상태:', response.status);
            if (response.ok) {
              setIsAuthenticating(false);
              console.log('✅ 쿠키 설정 성공, 사용자 정보 가져오기');
              await fetchUser(); // 사용자 정보 가져오기를 기다림
              console.log('🏠 메인 페이지로 이동');
              window.location.href = '/'; // 이렇게 하면 서버 측에서 쿠키를 인식함
            } else {
              console.error('❌ Failed to set cookies, 응답:', await response.text());
              setIsAuthenticating(false);
              toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
              window.location.href = '/'; 
            }
          })
          .catch(err => {
            console.error('❌ Error setting cookies:', err);
            setIsAuthenticating(false);
            toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
            window.location.href = '/'; 
          });
        } else {
          console.error('❌ 토큰이 없습니다:', { accessToken, refreshToken });
          setIsAuthenticating(false);
          toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
          window.location.href = '/'; 
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