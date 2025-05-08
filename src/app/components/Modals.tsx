'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onYoutubeLogin?: (isLoggedIn: boolean) => void;
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


export function YoutubeModal({ isOpen, onClose, onYoutubeLogin }: ModalProps) {
  const isDark = useSystemTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) return null;

  const handleLogin = () => {
    // Simulate API call for YouTube login
    const isLoginSuccessful = false; // Replace with actual login logic
    if (isLoginSuccessful) {
      onYoutubeLogin?.(true);
      toast.success('유튜브 연동이 완료되었습니다!');
    } else {
      toast.error('유튜브 연동에 실패했습니다.');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg max-w-md w-full mx-4`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">유튜브 로그인</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">준비중</label>
              <input
                type="text"
                className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg 
                  text-gray-500 dark:text-gray-400 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="준비중"
                disabled
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] 
              dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] transition-colors"
          >
            연동하기
          </button>
        </div>
      </div>
    </div>
  );
} 