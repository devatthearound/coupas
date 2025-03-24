'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'next/navigation';
import { checkCoupangApiKeys } from '@/services/coupang/keys';
import { isElectron } from '@/utils/environment';

interface NavbarProps {
  onFormatModalOpen: () => void;
  onApiModalOpen: () => void;
  onYoutubeLoginOpen: () => void;
  isYoutubeLoggedIn: boolean;
  currentPage: string;
}

export default function Navbar({ 
  onFormatModalOpen, 
  onApiModalOpen,
  onYoutubeLoginOpen,
  isYoutubeLoggedIn,
  currentPage,
}: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const { user, logout } = useUser();

  useEffect(() => {
    // Check if API keys are configured
    const fetchApiConfigStatus = async () => {
      try {
        const isConfigured = await checkCoupangApiKeys();
        setIsApiConfigured(isConfigured);
      } catch (error) {
        console.error('API 키 상태 확인 중 오류:', error);
      }
    };

    if(user) {
      fetchApiConfigStatus();
    }
  }, [user]);


  const isActive = (path: string) => pathname === path;

  const handleLogin = () => {
    if (isElectron()) {
      const electronPath = encodeURIComponent(`coupas-auth://login`);
      const redirectUrl = `https://growsome.kr/login?redirect_to=${electronPath}`;

      router.push(`/external-redirect?url=${encodeURIComponent(redirectUrl)}`);
    } else {
      const redirectTo = encodeURIComponent(`${process.env.NEXT_PUBLIC_COUPAS_BASE_PATH}/${pathname}`);

      const redirectUrl = `${process.env.NEXT_PUBLIC_GROWSOME_BASE_PATH}/login?redirect_to=${redirectTo}`;

      router.push(redirectUrl);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-[#514FE4] to-[#6C63FF] bg-clip-text text-transparent">
                Growsome
              </span>
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">ㅣ 쿠팡 파트너스 자동화</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/search"
                className={`text-sm transition-colors ${
                  isActive('/search') 
                    ? 'text-[#514FE4] dark:text-[#6C63FF] font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#514FE4] dark:hover:text-[#6C63FF]'
                }`}
              >
                상품선택
              </Link>
              <Link
                href="/video-creation"
                className={`text-sm transition-colors ${
                  isActive('/video-creation') 
                    ? 'text-[#514FE4] dark:text-[#6C63FF] font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#514FE4] dark:hover:text-[#6C63FF]'
                }`}
              >
                영상만들기
              </Link>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">

            {user ? (
          <>
            <button 
              onClick={handleLogout}
            >
              로그아웃
            </button>
            <button
              onClick={() => {
                onApiModalOpen();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isApiConfigured 
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-[#514FE4]/10 dark:bg-[#514FE4]/20 text-[#514FE4] dark:text-[#6C63FF]'
              }`}
            >
              {isApiConfigured ? '쿠팡 API 설정됨' : '쿠팡 API 설정'}
            </button>
          </>
        ) : (
          <button onClick={handleLogin}>
            로그인
          </button>
        )}
            <button
              onClick={onYoutubeLoginOpen}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1 ${
                isYoutubeLoggedIn 
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-[#514FE4]/10 dark:bg-[#514FE4]/20 text-[#514FE4] dark:text-[#6C63FF]'
              }`}
            >
              <LockClosedIcon className="w-4 h-4" />
              {isYoutubeLoggedIn ? '유튜브 연동됨' : '유튜브 로그인'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none"
            >
              <span className="sr-only">메뉴 열기</span>
              {!isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`${
          isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
        } md:hidden border-t border-gray-100 absolute w-full bg-white transition-all duration-200 ease-in-out`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/search"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/search') 
                ? 'text-blue-700 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            상품선택
          </Link>
          <Link
            href="/video-creation"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/video-creation') 
                ? 'text-blue-700 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            영상만들기
          </Link>

          {user ? (
          <>
            <button 
              onClick={handleLogout}
            >
              로그아웃
            </button>
            <button
            onClick={() => {
              onApiModalOpen();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            쿠팡 API 설정
          </button>
          </>
        ) : (
          <button onClick={handleLogin}>
            로그인
          </button>
        )}
          <button
            onClick={() => {
              onYoutubeLoginOpen();
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-1 ${
              isYoutubeLoggedIn 
                ? 'text-green-700 bg-green-50 hover:bg-green-100' 
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <LockClosedIcon className="w-4 h-4" />
            {isYoutubeLoggedIn ? '유튜브 연동됨' : '유튜브 로그인'}
          </button>
        </div>
      </div>
    </nav>
  );
}