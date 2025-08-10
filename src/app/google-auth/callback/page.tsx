'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/contexts/UserContext';

const GoogleAuthCallbackPage = () => {
  const [status, setStatus] = useState('로그인 처리 중...');
  const router = useRouter();
  const { fetchUser } = useUser();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Growsome 로그인 토큰 처리
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        // Google OAuth 코드 처리 (기존 YouTube 연동)
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        console.log('🔗 콜백 페이지 - URL 파라미터 확인');
        console.log('🔑 Access Token:', accessToken ? 'Found' : 'None');
        console.log('🔄 Refresh Token:', refreshToken ? 'Found' : 'None');
        console.log('📋 Google Code:', code ? 'Found' : 'None');
        
        if (accessToken && refreshToken) {
          // Growsome 로그인 토큰 처리
          console.log('🌟 Growsome 로그인 토큰 처리 시작');
          setStatus('Growsome 로그인 토큰 설정 중...');
          
          // 쿠키 설정 API 호출
          const response = await fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken, refreshToken })
          });
          
          if (!response.ok) {
            throw new Error('토큰 설정 중 오류가 발생했습니다.');
          }
          
          console.log('✅ Growsome 토큰 설정 완료');
          setStatus('로그인 성공! 사용자 정보 가져오는 중...');
          
          // 사용자 정보 새로고침
          await fetchUser();
          
          setStatus('로그인 완료! 메인 페이지로 이동 중...');
          setTimeout(() => {
            router.push('/');
          }, 1000);
          
        } else if (code) {
          // Google OAuth 코드 처리 (기존 YouTube 연동)
          console.log('📺 YouTube OAuth 코드 처리 시작');
          console.log('📋 받은 코드:', code);
          console.log('🔍 State:', state);
          setStatus('YouTube 인증 코드 교환 중...');
          
          try {
            const response = await fetch(`/api/google-auth`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code, state })
            });
            
            console.log('📡 API 응답 상태:', response.status);
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('❌ API 오류 응답:', errorData);
              throw new Error(`YouTube 인증 코드 교환 중 오류가 발생했습니다. (${response.status})`);
            }

            const result = await response.json();
            console.log('✅ 인증 성공 결과:', result);

            setStatus('YouTube 인증 성공! 리디렉션 중...');
            if(window.electron) {
              setStatus('YouTube 인증이 완료되었습니다. 이 창을 닫고 메인 창으로 돌아가주세요.');
              setTimeout(() => {
                window.close();
              }, 3000);
            } else {
              router.push('/');
            }
          } catch (apiError) {
            console.error('❌ API 호출 중 오류:', apiError);
            throw apiError;
          }
        } else {
          throw new Error('인증 정보가 없습니다. (토큰 또는 코드 없음)');
        }
        
      } catch (error) {
        console.error('❌ 콜백 처리 오류:', error);
        setStatus(`인증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        
        // 5초 후 메인 페이지로 이동
        setTimeout(() => {
          router.push('/');
        }, 5000);
      }
    };
    
    handleCallback();
  }, [router, fetchUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">로그인 처리</h1>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-lg text-center">{status}</p>
      
      {status.includes('실패') && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">5초 후 메인 페이지로 자동 이동됩니다.</p>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthCallbackPage;