'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InstagramAuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleInstagramAuth = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Instagram 인증 오류:', error);
        window.close();
        return;
      }

      if (code) {
        try {
          // 인증 코드를 서버로 전송
          const response = await fetch('/api/instagram-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Instagram 인증 성공:', data);
            
            // 부모 창에 메시지 전송 (팝업인 경우)
            if (window.opener) {
              window.opener.postMessage(
                { 
                  type: 'INSTAGRAM_AUTH_SUCCESS', 
                  user: data.user 
                }, 
                window.location.origin
              );
            }

            // Electron 환경에서 IPC 사용 (필요한 경우)
            if (typeof window !== 'undefined' && (window as any).electron) {
              (window as any).electron.ipcRenderer.send('instagram-auth-success', data.user);
            }
            
            window.close();
          } else {
            throw new Error('Instagram 인증 실패');
          }
        } catch (error) {
          console.error('Instagram 인증 처리 오류:', error);
          window.close();
        }
      }
    };

    handleInstagramAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Instagram 연동 중...</h1>
          <p className="text-gray-600 mb-6">
            Instagram 계정 연동을 처리하고 있습니다.
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 