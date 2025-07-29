'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onYoutubeLogin?: (isLoggedIn: boolean) => void;
  onApiConfigSaved?: () => void; // API 설정 저장 콜백 추가
  isYoutubeLoggedIn?: boolean;
}

// 시스템 테마 감지 훅 수정
const useSystemTheme = () => {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 마운트되기 전에는 false 반환
  if (!isMounted) return false;

  return isDark;
};

export function FormatModal({ isOpen, onClose }: ModalProps) {
  const isDark = useSystemTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg max-w-md w-full mx-4`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">출력 형식 설정</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">출력 형식</label>
              <input
                type="text"
                className="w-full p-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg 
                  text-gray-500 dark:text-gray-400 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="준비중"
                disabled
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] 
              dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApiModal({ isOpen, onClose, onApiConfigSaved }: ModalProps) {
  const isDark = useSystemTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  useEffect(() => {
    setIsMounted(true);
    if (isOpen) {
      // API 키 불러오기
      const loadApiKeys = async () => {
        const res = await getCoupangApiKeys();
        if (res) {
          setAccessKey(res.accessKey);
          setSecretKey(res.secretKey);
        }
      };
      loadApiKeys();
    }
  }, [isOpen]);

  const handleSave = async () => {
    const res = await saveCoupangApiKeys({ accessKey, secretKey });
    
    if (res.message) {
      toast.success("API 키를 저장했습니다.");
      onApiConfigSaved?.(); // 콜백 호출
      onClose(); // 모달 닫기
    } else {
      toast.error('API 키를 저장하는 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen || !isMounted) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg max-w-md w-full mx-4`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API 설정</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Key</label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg 
                  text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Access Key를 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg 
                  text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Secret Key를 입력하세요"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] 
              dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export function YoutubeModal({ isOpen, onClose, onYoutubeLogin, isYoutubeLoggedIn }: ModalProps) {
  const isDark = useSystemTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 인증 상태를 주기적으로 확인하는 폴링
    let authCheckInterval: NodeJS.Timeout | null = null;
    
    if (isAuthenticating) {
      authCheckInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/google-auth/token');
          if (response.ok) {
            console.log('인증이 완료되었습니다.');
            setIsAuthenticating(false);
            onYoutubeLogin?.(true);
            toast.success('유튜브 연동이 완료되었습니다!');
            onClose();
            if (authCheckInterval) {
              clearInterval(authCheckInterval);
            }
          }
        } catch (error) {
          console.log('인증 상태 확인 중 오류:', error);
        }
      }, 2000);
    }

    return () => {
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
    };
  }, [isAuthenticating, onYoutubeLogin, onClose]);

  if (!isOpen || !isMounted) return null;

  const handleLogin = () => {
    if (typeof window !== 'undefined' && window.electron) {
      setIsAuthenticating(true);
      // 임시로 로컬 구글 인증 사용 (growsome.kr 엔드포인트 준비 전까지)
      window.electron.openExternal(`${window.location.origin}/google-auth`);
    } else {
      // 웹 환경에서는 로컬 구글 인증 페이지로 이동
      window.open('/google-auth', '_blank');
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/google-auth/token', {
        method: 'DELETE',
      });

      if (response.ok) {
        onYoutubeLogin?.(false);
        toast.success('유튜브 연동이 해제되었습니다.');
        onClose();
      } else {
        throw new Error('연동 해제 실패');
      }
    } catch (error) {
      console.error('연동 해제 중 오류:', error);
      toast.error('연동 해제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg max-w-md w-full mx-4`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">유튜브 로그인</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-6">
          {isAuthenticating ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg 
                  className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                구글 계정 인증 중...
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                외부 브라우저에서 구글 로그인을 완료해주세요.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                인증이 완료되면 자동으로 연동됩니다.
              </p>
            </div>
          ) : isYoutubeLoggedIn ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg 
                  className="w-full h-full text-green-500" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                유튜브 연동 완료
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                유튜브 계정이 성공적으로 연동되었습니다. 이제 영상을 자동으로 업로드할 수 있습니다.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      현재 이용 가능한 기능
                    </p>
                    <ul className="text-sm text-green-700 dark:text-green-300 mt-1">
                      <li>• 영상 자동 업로드</li>
                      <li>• 썸네일 설정</li>
                      <li>• 제목, 설명, 태그 자동 설정</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg 
                  className="w-full h-full text-red-500" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                유튜브 계정 연동
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                구글 계정으로 로그인하여 유튜브에 영상을 업로드할 수 있습니다.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      연동 후 이용 가능한 기능
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      <li>• 영상 자동 업로드</li>
                      <li>• 썸네일 설정</li>
                      <li>• 제목, 설명, 태그 자동 설정</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? '인증 중...' : '취소'}
          </button>
          {!isAuthenticating && (
            isYoutubeLoggedIn ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                연동 해제
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 연동하기
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
} 
