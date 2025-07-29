// app/contexts/UserContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 사용자 정보 타입 정의
type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  // 필요한 다른 사용자 속성들
};

// 컨텍스트 타입 정의
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setDevToken: (token: string) => Promise<void>; // 개발용 토큰 설정 함수 추가
  debugTokenStatus: () => void; // 디버깅 함수 추가
};

// 컨텍스트 생성
const UserContext = createContext<UserContextType | undefined>(undefined);

// 컨텍스트 Provider 컴포넌트
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UserContext.tsx의 fetchUser 함수 수정
  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('👤 사용자 정보 가져오기 시작...');

    try {
      // 개발 환경에서 토큰을 헤더로 전송
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      let hasToken = false;
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('coupas_access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          hasToken = true;
          console.log('🔑 localStorage에서 토큰 발견, 헤더에 포함');
        } else {
          console.log('❌ localStorage에 토큰 없음');
        }
      }

      console.log('🌐 API 호출 중: /api/user/me');
      const response = await fetch(`/api/user/me`, {
        credentials: 'include',
        headers,
      });

      console.log(`📡 API 응답 상태: ${response.status}`);
      const data = await response.json();
      console.log('📋 API 응답 데이터:', data);
      
      // authenticated 필드로 인증 상태 확인
      if (data.authenticated) {
        setUser(data.user);
        console.log('✅ 인증 성공, 사용자 정보 설정 완료');
        if (data.dev) {
          console.log('🔧 개발 모드로 실행 중');
        }
      } else {
        // 인증되지 않은 경우 사용자 정보는 null로 설정
        setUser(null);
        console.log('❌ 인증 실패, 사용자 정보 null 설정');
        
        // 에러 메시지가 있으면 설정 (선택적)
        if (data.message) {
          setError(data.message);
          console.log('⚠️ 서버 메시지:', data.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      console.error('❌ 사용자 정보 가져오기 실패:', err);
      setError(errorMessage);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 사용자 정보 가져오기 완료');
    }
  };
  // 로그아웃 함수
  const logout = async () => {
    try {
      console.log('🚪 로그아웃 시작...');
      
      // localStorage 토큰 정리 (개발 환경)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('coupas_access_token');
        console.log('🗑️ localStorage 토큰 정리 완료');
      }

      const response = await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('⚠️ 서버 로그아웃 요청 실패, 클라이언트 로그아웃 진행');
      }

      setUser(null);
      setError(null);
      console.log('✅ 로그아웃 완료');
      window.location.href = `/`;
    } catch (err) {
      console.error('❌ 로그아웃 중 오류:', err);
      // 오류가 있어도 클라이언트에서는 로그아웃 처리
      setUser(null);
      localStorage.removeItem('coupas_access_token');
      setError(err instanceof Error ? err.message : 'Logout failed');
      window.location.href = `/`;
    }
  };

  // 사용자 정보 업데이트 함수
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // 디버깅용 토큰 상태 확인 함수
  const debugTokenStatus = () => {
    console.log('🔍 === 토큰 상태 디버깅 ===');
    
    if (typeof window === 'undefined') {
      console.log('❌ 서버사이드 렌더링 환경');
      return;
    }
    
    const token = localStorage.getItem('coupas_access_token');
    
    if (!token) {
      console.log('❌ localStorage에 토큰 없음');
      return;
    }
    
    console.log('✅ 토큰 존재');
    console.log('📝 토큰 길이:', token.length);
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ 잘못된 JWT 형식');
        return;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('📋 토큰 페이로드:', payload);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < currentTime;
      
      if (isExpired) {
        const expiredTime = new Date(payload.exp * 1000);
        console.log(`❌ 토큰 만료됨 (${expiredTime.toLocaleString()})`);
      } else if (payload.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        console.log(`✅ 토큰 유효 (만료: ${expiresAt.toLocaleString()})`);
      } else {
        console.log('⚠️ 만료 정보 없음');
      }
      
    } catch (err) {
      console.log('❌ 토큰 파싱 실패:', err);
    }
    
    console.log('👤 현재 사용자 상태:', user);
    console.log('⚠️ 현재 오류:', error);
    console.log('🔄 로딩 중:', isLoading);
    console.log('🔍 === 디버깅 완료 ===');
  };

  // 개발용 토큰 설정 함수
  const setDevToken = async (token: string) => {
    try {
      console.log('🔑 토큰 설정 시작...');
      
      // 토큰 형식 확인
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('유효하지 않은 토큰 형식입니다.');
      }
      
      // 토큰 디코딩해서 사용자 정보 추출
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📋 토큰 페이로드:', payload);
      
      // 토큰 만료 확인
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new Error(`토큰이 만료되었습니다. (만료시간: ${new Date(payload.exp * 1000).toLocaleString()})`);
      }
      
      // 토큰을 localStorage에 저장
      localStorage.setItem('coupas_access_token', token);
      console.log('💾 토큰 localStorage 저장 완료');
      
      // 가짜 사용자 정보 설정 (개발용)
      const devUser: User = {
        id: payload.userId || '7',
        name: 'Development User',
        email: payload.email || 'growsome.me@gmail.com',
        role: 'user'
      };
      
      setUser(devUser);
      setError(null);
      
      console.log('✅ 개발용 토큰 설정 완료');
      console.log('👤 사용자 정보:', devUser);
      
      if (payload.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        console.log(`⏰ 토큰 만료시간: ${expiresAt.toLocaleString()}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 설정 중 알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 토큰 설정 오류:', err);
      
      // 오류 시 토큰 정리
      localStorage.removeItem('coupas_access_token');
      setUser(null);
      
      throw err; // 오류를 다시 던져서 상위에서 처리할 수 있도록
    }
  };

  // 초기 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    const initializeAuth = async () => {
      // 개발 환경에서 localStorage의 토큰 확인
      if (process.env.NODE_ENV === 'development') {
        const storedToken = localStorage.getItem('coupas_access_token');
        if (storedToken) {
          console.log('💾 저장된 개발용 토큰을 발견했습니다. 자동 로그인 중...');
          try {
            // 토큰을 설정하고 API로 검증
            await setDevToken(storedToken);
            console.log('✅ 토큰 설정 완료, API 검증 중...');
          } catch (error) {
            console.error('❌ 토큰 설정 중 오류:', error);
          }
        }
      }
      
      // 항상 fetchUser를 호출해서 현재 인증 상태 확인
      await fetchUser();
    };

    initializeAuth();
  }, []);

  // 컨텍스트 값
  const value = {
    user,
    isLoading,
    error,
    fetchUser,
    logout,
    updateUser,
    setDevToken,
    debugTokenStatus,
  };

  // 개발 환경에서 글로벌 디버깅 및 개발용 함수 추가
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).debugAuth = debugTokenStatus;
    (window as any).setDevToken = setDevToken;
    
    // 개발자 도움말 함수
    (window as any).devHelp = () => {
      console.log(`
🔧 개발자 도구 도움말:

📋 사용 가능한 함수들:
- setDevToken("토큰")   : 개발용 토큰 설정
- debugAuth()          : 현재 인증 상태 확인
- devHelp()           : 이 도움말 표시
- testYouTubeAuth()   : 유튜브 인증 테스트

🚀 빠른 개발용 토큰 설정:
setDevToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJpYXQiOjE3NTM3NjAzMTUsImV4cCI6MTc1NjM1MjMxNX0.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w")

💡 팁: 
- 로그인 버튼을 클릭하면 기본적으로 Growsome 로그인으로 리다이렉트됩니다
- 빠른 개발이 필요할 때만 위의 setDevToken()을 사용하세요
- 유튜브 업로드 문제가 있으면 testYouTubeAuth()로 테스트하세요
      `);
    };
    
    // 유튜브 인증 테스트 함수
    (window as any).testYouTubeAuth = async () => {
      try {
        console.log('🧪 유튜브 인증 테스트 시작...');
        const response = await fetch('/api/google-auth/token');
        const data = await response.json();
        console.log('📋 인증 응답:', data);
        
        if (data.success) {
          console.log('✅ 유튜브 인증 토큰 확인됨');
          console.log('🔑 Access Token:', data.access_token ? 'Found' : 'Missing');
          console.log('🔄 Refresh Token:', data.refresh_token ? 'Found' : 'Missing');
          console.log('⏰ 만료 시간:', new Date(data.expires_at).toLocaleString());
        } else {
          console.log('❌ 유튜브 인증 실패:', data.error);
        }
      } catch (error) {
        console.error('❌ 유튜브 인증 테스트 오류:', error);
      }
    };
    
    console.log('🔧 개발자 도구가 활성화되었습니다. devHelp()를 입력하면 도움말을 볼 수 있습니다.');
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 컨텍스트 사용을 위한 훅
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}