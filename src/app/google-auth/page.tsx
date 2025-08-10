'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const GoogleAuthPage = () => {
  const [status, setStatus] = useState('초기화 중...');

  useEffect(() => {
  
    const checkExistingToken = async () => {
      try {
        setStatus('기존 인증 정보 확인 중...');
        const response = await fetch('/api/google-auth/token', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setStatus('이미 인증된 계정이 있습니다.');
          return true;
        }
        return false;
      } catch (error) {
        console.error('토큰 확인 중 오류:', error);
        return false;
      }
    };

    const startAuthFlow = async () => {
      try {
        // 기존 토큰 확인
        const hasValidToken = await checkExistingToken();
        if (hasValidToken) {
          setStatus('이미 인증된 계정이 있습니다. 3초 후 메인 페이지로 이동합니다.');
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        setStatus('인증 URL 요청 중...');
        const response = await fetch(`/api/google-auth`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ 인증 URL 요청 실패:', errorData);
          throw new Error(`인증 URL을 가져오는데 실패했습니다 (${response.status})`);
        }
        
        const { authUrl } = await response.json();
        console.log('🔗 인증 URL 생성됨:', authUrl);
        setStatus('구글 인증 페이지로 리디렉션 중...');
        
        // 새 창에서 인증 페이지 열기
        const authWindow = window.open(authUrl, '_blank', 'width=500,height=600');
        
        if (!authWindow) {
          setStatus('팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.');
          return;
        }
        
        setStatus('구글 인증 페이지가 열렸습니다. 인증을 완료해주세요.');
      } catch (error) {
        console.error('인증 오류:', error);
        setStatus('인증 프로세스 초기화 중 오류가 발생했습니다.');
      }
    };

    startAuthFlow();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">구글 인증</h1>
      <p className="text-lg">{status}</p>
      <p className="mt-4">외부 브라우저에서 인증을 완료해주세요.</p>
    </div>
  );
};

export default GoogleAuthPage;