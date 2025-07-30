'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LockClosedIcon, UserIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { useUser } from '../contexts/UserContext';
import { isElectron } from '@/utils/environment';
import UserMenu from './UserMenu';
import GuestMenu from './GuestMenu';

interface NavbarProps {
  onFormatModalOpen: () => void;
  onApiModalOpen: () => void;
  onYoutubeLoginOpen: () => void;
  isYoutubeLoggedIn: boolean;
  currentPage: string;
  apiConfigUpdateTrigger?: number;
}

export default function Navbar({ 
  onFormatModalOpen, 
  onApiModalOpen,
  onYoutubeLoginOpen,
  isYoutubeLoggedIn,
  currentPage,
  apiConfigUpdateTrigger,
}: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const { user, logout, setDevToken } = useUser();
  
  // 사용자 상태 디버깅 (빌드 시 로그 최소화)
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Navbar - 현재 사용자 상태:', user);
    console.log('🔄 Navbar - 사용자 로딩 상태:', user === null ? '로그인 안됨' : '로그인됨');
    console.log('🌍 Navbar - 현재 환경:', isElectron() ? 'Electron' : 'Web');
  }
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 일렉트론 환경 디버깅 useEffect (빌드 시 로그 최소화)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 === Navbar 컴포넌트 마운트 - 환경 진단 ===');
      console.log('🌍 isElectron():', isElectron());
      console.log('🖥️ window.electron 존재:', !!(window as any).electron);
      console.log('📱 navigator.userAgent:', navigator.userAgent);
      console.log('📋 confirm 함수 존재:', typeof confirm !== 'undefined');
      console.log('📋 alert 함수 존재:', typeof alert !== 'undefined');
      console.log('🔄 process 객체:', !!(window as any).process);
      console.log('🔧 process.versions:', (window as any).process?.versions);
      console.log('🔧 === 환경 진단 완료 ===');
    }
  }, []);

  // useEffect(() => {
  //   // Check if API keys are configured
  //   const fetchApiConfigStatus = async () => {
  //     try {
  //       const isConfigured = await checkCoupangApiKeys();
  //       setIsApiConfigured(isConfigured);
  //     } catch (error) {
  //       console.error('API 키 상태 확인 중 오류:', error);
  //     }
  //   };

  //   if(user) {
  //     fetchApiConfigStatus();
  //   }
  // }, [user, apiConfigUpdateTrigger]); // apiConfigUpdateTrigger 의존성 추가

  // 사용자 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleDevLogin = async () => {
    console.log('🔑 === 개발용 로그인 시작 ===');
    console.log('🌍 개발용 로그인 환경:', isElectron() ? 'Electron' : 'Web');
    console.log('📱 User Agent:', navigator.userAgent);
    
    // 🆕 새로운 개발용 토큰 (30일 유효: 2025.7.29 ~ 2025.8.28)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJpYXQiOjE3NTM3NjAzMTUsImV4cCI6MTc1NjM1MjMxNX0.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w';
    
    try {
      console.log('🔑 개발용 로그인 시작...');
      console.log('🔑 토큰 설정 시작...');
      
      await setDevToken(token);
      console.log('✅ 개발용 로그인 성공!');
      
      // 일렉트론에서 alert 함수 작동 여부 확인
      console.log('📋 alert 함수 존재 여부:', typeof alert !== 'undefined');
      
      // 개발용 메시지
      setTimeout(() => {
        try {
          alert('✅ 개발용 로그인 완료!\n\n🔑 사용자: Development User\n📧 이메일: growsome.me@gmail.com\n\n🛍️ 쿠팡 API 키가 자동으로 설정되었습니다:\n- Access Key: 028d1bc3-8dab-43a8-b855-b1f21797b4f0\n- Secret Key: b51e8cd97285c85c63184be9cb8e038237d8ae14');
          console.log('✅ 성공 알림 표시 완료');
        } catch (alertError) {
          console.error('❌ alert 함수 오류:', alertError);
          console.log('📢 브라우저 콘솔 메시지로 대체: 개발용 로그인이 성공적으로 완료되었습니다!');
        }
      }, 500);
      
      console.log('🔑 === 개발용 로그인 완료 ===');
    } catch (error) {
      console.error('❌ 개발용 로그인 실패:', error);
      
      try {
        alert('❌ 개발용 로그인에 실패했습니다.\n콘솔을 확인해주세요.');
      } catch (alertError) {
        console.error('❌ 오류 알림도 실패:', alertError);
        console.error('📢 브라우저 콘솔 메시지로 대체: 개발용 로그인에 실패했습니다!');
      }
    }
  };

  // 배포 환경 감지 함수
  const getDeploymentDomain = () => {
    if (typeof window === 'undefined') return '';
    
    // 배포 환경에서는 실제 도메인 사용
    const currentOrigin = window.location.origin;
    
    // localhost가 아니면 배포 환경으로 간주
    if (!currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1')) {
      return currentOrigin;
    }
    
    // 개발 환경에서는 localhost 사용
    return 'http://localhost:3000';
  };

  // Growsome 외부 로그인 처리 함수
  const handleGrowsomeLogin = () => {
    console.log('🌐 Growsome 로그인 시작...');
    
    const deploymentDomain = getDeploymentDomain();
    const isDeployment = !deploymentDomain.includes('localhost');
    
    console.log('🏭 배포 환경 감지:', isDeployment);
    console.log('🌐 현재 도메인:', deploymentDomain);
    
    if (isElectron()) {
      console.log('🖥️ Electron 환경 - 외부 브라우저로 리다이렉트');
      const electronPath = encodeURIComponent(`coupas-auth://login`);
      const redirectUrl = `https://growsome.kr/login?redirect_to=${electronPath}`;
      console.log('🔗 리다이렉트 URL:', redirectUrl);
      
      // Electron에서 두 가지 방법 시도
      if ((window as any).electron?.openExternal) {
        console.log('🎯 방법 1: 직접 외부 브라우저 열기 시도');
        try {
          (window as any).electron.openExternal(redirectUrl);
          console.log('✅ 직접 외부 브라우저 열기 성공');
        } catch (error) {
          console.error('❌ 직접 외부 브라우저 열기 실패:', error);
          console.log('🔄 방법 2: external-redirect 페이지 사용');
          router.push(`/external-redirect?url=${encodeURIComponent(redirectUrl)}`);
        }
      } else {
        console.log('🔄 방법 2: external-redirect 페이지 사용 (openExternal 없음)');
        router.push(`/external-redirect?url=${encodeURIComponent(redirectUrl)}`);
      }
    } else {
      console.log('🌐 웹 환경 - Growsome 로그인 처리');
      
      if (isDeployment) {
        // 배포 환경: 직접 리다이렉트 (새창 없음)
        console.log('🚀 배포 환경 - 직접 리다이렉트');
        const callbackUrl = `${deploymentDomain}/google-auth/callback`;
        const redirectUrl = `https://growsome.kr/login?redirect_to=${encodeURIComponent(callbackUrl)}`;
        console.log('🔗 배포 환경 리다이렉트 URL:', redirectUrl);
        
        // 배포 환경에서는 직접 리다이렉트
        window.location.href = redirectUrl;
      } else {
        // 개발 환경: 배포환경과 동일한 방식으로 테스트 (직접 리다이렉트)
        console.log('🔧 개발 환경 - 배포환경과 동일한 직접 리다이렉트 테스트');
        const callbackUrl = `${deploymentDomain}/google-auth/callback`;
        const redirectUrl = `https://growsome.kr/login?redirect_to=${encodeURIComponent(callbackUrl)}`;
        console.log('🔗 개발 환경 직접 리다이렉트 URL:', redirectUrl);
        
        // 개발환경에서도 배포환경과 동일하게 직접 리다이렉트
        console.log('🌟 배포환경과 동일한 로그인 플로우 테스트 시작');
        window.location.href = redirectUrl;
      }
    }
  };

  const handleLogin = () => {
    console.log('🔑 === 로그인 함수 시작 ===');
    console.log('🔑 로그인 버튼 클릭됨');
    
    try {
      // 환경 정보 상세 로깅
      console.log('🔍 환경 감지 상세 정보:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- isElectron():', isElectron());
      console.log('- window.electron 존재:', !!(window as any).electron);
      console.log('- userAgent:', navigator.userAgent);
      console.log('- process.versions:', (window as any).process?.versions);
    
    // 개발 환경에서도 실제 로그인 연동 테스트
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 개발 환경 감지 - Growsome 로그인 연동 테스트 모드');
      
      const electronDetected = isElectron();
      console.log('🖥️ Electron 감지 결과:', electronDetected);
      
      // 개발환경에서도 기본적으로 Growsome 로그인 사용 (테스트 완결을 위해)
      console.log('🌟 개발환경 Growsome 로그인 연동 테스트 시작');
      console.log('💡 개발용 토큰이 필요한 경우 브라우저 콘솔에서 setDevToken() 사용');
      
      // 개발환경에서도 바로 Growsome 로그인으로 진행
      handleGrowsomeLogin();
      return;
    }

    // 프로덕션 환경에서는 바로 Growsome 로그인
    console.log('🚀 프로덕션 환경 - Growsome 로그인');
    handleGrowsomeLogin();
    
    } catch (error) {
      console.error('❌ handleLogin 함수 전체 오류:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('로그인 처리 중 오류가 발생했습니다: ' + errorMessage);
    }
    
    console.log('🔑 === 로그인 함수 완료 ===');
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsUserMenuOpen(false);
  };

  return (
    <nav className={`${pathname === '/' ? 'bg-white/90 backdrop-blur-sm border-b border-gray-100' : 'bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800'} fixed top-0 w-full z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-[#514FE4] to-[#6C63FF] bg-clip-text text-transparent">
               VIBE
              </span>
            </Link>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm transition-colors ${
                  isActive('/') 
                    ? 'text-[#514FE4] dark:text-[#6C63FF] font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#514FE4] dark:hover:text-[#6C63FF]'
                }`}
              >
                제휴영상 만들기
              </Link>
              <Link
                href="/review-analyzer"
                className={`text-sm transition-colors ${
                  isActive('/review-analyzer') 
                    ? 'text-[#514FE4] dark:text-[#6C63FF] font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#514FE4] dark:hover:text-[#6C63FF]'
                }`}
              >
                리뷰분석
              </Link>

            </div>
          </div>

          {/* 우측 버튼들 */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 bg-[#514FE4] rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 드롭다운 메뉴 */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      {/* 사용자 정보 */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">계정 관리</p>
                      </div>

                      {/* 메뉴 항목들 */}
                      <div className="py-1">
                        <button
                          onClick={() => handleMenuItemClick(() => router.push('/settings'))}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                        >
                          <div className={`w-2 h-2 rounded-full ${isApiConfigured ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <span>API 연동 설정</span>
                          <span className={`ml-auto text-xs ${isApiConfigured ? 'text-green-600' : 'text-orange-600'}`}>
                            {isApiConfigured ? '연결됨' : '설정 필요'}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => handleMenuItemClick(() => router.push('/settings/sns'))}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                        >
                          <div className={`w-2 h-2 rounded-full ${isYoutubeLoggedIn ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                          <span>SNS 연동 설정</span>
                          <span className={`ml-auto text-xs ${isYoutubeLoggedIn ? 'text-green-600' : 'text-blue-600'}`}>
                            {isYoutubeLoggedIn ? '연동됨' : '연동하기'}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => handleMenuItemClick(() => router.push('/settings/video-templates'))}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                        >
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span>영상 템플릿 설정</span>
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        
                        <button
                          onClick={() => handleMenuItemClick(handleLogout)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>로그아웃</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                data-testid="login-button-desktop"
                title="로그인"
                onClick={(e) => {
                  console.log('🎯 === 로그인 버튼 클릭 감지 (데스크톱) ===');
                  console.log('🎯 클릭 이벤트 타입:', e.type);
                  console.log('🎯 클릭 시간:', new Date().toISOString());
                  console.log('🎯 이벤트 대상:', e.target);
                  console.log('🎯 현재 환경:', isElectron() ? 'Electron' : 'Web');
                  console.log('🎯 window 객체 존재:', typeof window !== 'undefined');
                  console.log('🎯 === 로그인 함수 호출 시작 ===');
                  
                  try {
                    handleLogin();
                    console.log('🎯 === 로그인 함수 호출 완료 ===');
                  } catch (error) {
                    console.error('❌ 로그인 함수 실행 중 오류:', error);
                    console.error('❌ 오류 상세:', {
                      name: error instanceof Error ? error.name : 'Unknown',
                      message: error instanceof Error ? error.message : String(error),
                      stack: error instanceof Error ? error.stack : undefined
                    });
                    
                    try {
                      alert('로그인 함수 실행 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
                    } catch (alertError) {
                      console.error('❌ alert도 실패:', alertError);
                    }
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all bg-[#514FE4] text-white hover:bg-[#403bb3]"
                style={{ zIndex: 10, position: 'relative' }}
              >
                로그인
              </button>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">메뉴 열기</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') 
                ? 'text-blue-700 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            제휴영상 만들기
          </Link>
          <Link
            href="/review-analyzer"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/review-analyzer') 
                ? 'text-blue-700 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            리뷰분석
          </Link>


          {/* 모바일 계정 메뉴 */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
            {user ? (
              <>
                {/* 사용자 정보 */}
                <div className="px-3 py-3 bg-gray-50 dark:bg-gray-800 rounded-md mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#514FE4] rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">계정 관리</p>
                    </div>
                  </div>
                </div>

                {/* 메뉴 항목들 */}
                <button
                  onClick={() => {
                    router.push('/settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 mt-1"
                >
                  <div className={`w-3 h-3 rounded-full ${isApiConfigured ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span>API 연동 설정</span>
                  <span className={`ml-auto text-xs ${isApiConfigured ? 'text-green-600' : 'text-orange-600'}`}>
                    {isApiConfigured ? '연결됨' : '설정 필요'}
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/settings/sns');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 mt-1"
                >
                  <div className={`w-3 h-3 rounded-full ${isYoutubeLoggedIn ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <span>SNS 연동 설정</span>
                  <span className={`ml-auto text-xs ${isYoutubeLoggedIn ? 'text-green-600' : 'text-blue-600'}`}>
                    {isYoutubeLoggedIn ? '연동됨' : '연동하기'}
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/settings/video-templates');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 mt-1"
                >
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>영상 템플릿 설정</span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => {
                  console.log('🎯 === 로그인 버튼 클릭 감지 (모바일) ===');
                  console.log('🎯 클릭 이벤트 타입:', e.type);
                  console.log('🎯 클릭 시간:', new Date().toISOString());
                  console.log('🎯 이벤트 대상:', e.target);
                  console.log('🎯 현재 환경:', isElectron() ? 'Electron' : 'Web');
                  console.log('🎯 === 로그인 함수 호출 시작 ===');
                  
                  try {
                    handleLogin();
                    setIsMobileMenuOpen(false);
                    console.log('🎯 === 로그인 함수 호출 완료 ===');
                  } catch (error) {
                    console.error('❌ 로그인 함수 실행 중 오류:', error);
                    console.error('❌ 오류 상세:', {
                      name: error instanceof Error ? error.name : 'Unknown',
                      message: error instanceof Error ? error.message : String(error),
                      stack: error instanceof Error ? error.stack : undefined
                    });
                    
                    try {
                      alert('로그인 함수 실행 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
                    } catch (alertError) {
                      console.error('❌ alert도 실패:', alertError);
                    }
                  }
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-[#514FE4] text-white hover:bg-[#403bb3]"
                style={{ zIndex: 10, position: 'relative' }}
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
