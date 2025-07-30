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
      
      let hasTokenInLocalStorage = false;
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('coupas_access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          hasTokenInLocalStorage = true;
          console.log('🔑 localStorage에서 토큰 발견, 헤더에 포함');
        } else {
          console.log('⚠️ localStorage에 토큰 없음, 쿠키로 인증 시도');
        }
      }

      console.log('🌐 API 호출 중: /api/user/me');
      console.log('🍪 쿠키 포함하여 요청 (credentials: include)');
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
      console.log('🔑 개발용 토큰 설정 시작...');
      
      // 토큰 형식 확인
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('유효하지 않은 토큰 형식입니다. JWT 토큰이어야 합니다.');
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
      
      // 쿠키에도 저장
      try {
        const response = await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accessToken: token, 
            refreshToken: token // 개발환경에서는 같은 토큰 사용
          }),
        });
        
        if (response.ok) {
          console.log('🍪 개발용 토큰 쿠키 저장 완료');
        } else {
          console.warn('⚠️ 쿠키 저장 실패, localStorage만 사용');
        }
      } catch (cookieError) {
        console.warn('⚠️ 쿠키 저장 실패:', cookieError);
      }
      
      // 가짜 사용자 정보 설정 (개발용)
      const devUser: User = {
        id: payload.userId || '7',
        name: payload.name || 'Development User',
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
      
      // Electron 환경에서 글로벌 auth-callback 이벤트 리스너 설정
      if (typeof window !== 'undefined' && (window as any).electron?.auth) {
        console.log('🔧 UserContext: 글로벌 auth-callback 리스너 설정');
        
        (window as any).electron.auth.onAuthCallback((data: any) => {
          console.log('🎉 UserContext: 글로벌 auth-callback 수신!', data);
          
          if (data.accessToken && data.refreshToken) {
            console.log('🔑 토큰 처리 시작...');
            
            // localStorage에 저장
            localStorage.setItem('coupas_access_token', data.accessToken);
            console.log('💾 localStorage 저장 완료');
            
            // 쿠키에 저장
            fetch('/api/auth/set-cookies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            .then(async (response) => {
              if (response.ok) {
                console.log('🍪 쿠키 저장 성공');
                await fetchUser(); // 사용자 정보 새로고침
                console.log('🏠 메인 페이지로 이동');
                
                // 현재 external-redirect 페이지인 경우에만 이동
                if (window.location.pathname.includes('external-redirect')) {
                  window.location.href = '/';
                } else {
                  // 다른 페이지에서도 UI 업데이트를 위해 강제 리렌더링
                  window.location.reload();
                }
              } else {
                console.error('❌ 쿠키 저장 실패');
              }
            })
            .catch((error) => {
              console.error('❌ API 호출 실패:', error);
            });
          }
        });
        
        console.log('✅ UserContext: 글로벌 리스너 설정 완료');
      }
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
    (window as any).fetchUser = fetchUser;
    (window as any).logout = logout;
    
    // 쿠키 상태 확인 함수
    (window as any).checkCookies = async () => {
      console.log('🍪 쿠키 상태 확인 시작...');
      
      try {
        const response = await fetch('/api/user/me', { credentials: 'include' });
        const data = await response.json();
        console.log('📡 API 응답:', data);
        
        if (data.authenticated) {
          console.log('✅ 쿠키 인증 성공');
          console.log('👤 사용자 정보:', data.user);
        } else {
          console.log('❌ 쿠키 인증 실패');
          console.log('💬 메시지:', data.message);
        }
      } catch (error) {
        console.error('❌ 쿠키 확인 오류:', error);
      }
    };

    // 통합로그인 콜백 시뮬레이션 함수
    (window as any).simulateAuthCallback = (accessToken?: string, refreshToken?: string) => {
      console.log('🎭 인증 콜백 시뮬레이션 시작...');
      
      const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzUzNzYwMzE1LCJleHAiOjE3NTYzNTIzMTV9.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w";
      
      const tokens = {
        accessToken: accessToken || defaultToken,
        refreshToken: refreshToken || defaultToken
      };
      
      console.log('📨 콜백 데이터:', tokens);
      
      // 실제 콜백 처리와 동일한 로직 실행
      if ((window as any).electron?.auth) {
        // external-redirect 페이지의 콜백 처리 코드와 동일
        localStorage.setItem('coupas_access_token', tokens.accessToken);
        
        fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokens),
        })
        .then(async response => {
          if (response.ok) {
            console.log('✅ 시뮬레이션 성공, 사용자 정보 새로고침');
            await fetchUser();
          } else {
            console.error('❌ 쿠키 설정 실패');
          }
        });
      } else {
        console.log('⚠️ Electron 환경이 아니므로 브라우저 모드로 처리');
        localStorage.setItem('coupas_access_token', tokens.accessToken);
        fetchUser();
      }
    };

    // 스토리지 클리어 함수
    (window as any).clearAuth = async () => {
      console.log('🗑️ 인증 정보 모두 삭제...');
      
      // localStorage 클리어
      localStorage.removeItem('coupas_access_token');
      console.log('💾 localStorage 토큰 삭제됨');
      
      // 쿠키 클리어
      try {
        const response = await fetch('/api/auth/clear-cookies', { 
          method: 'POST',
          credentials: 'include' 
        });
        
        if (response.ok) {
          console.log('🍪 쿠키 삭제됨');
        } else {
          console.log('⚠️ 쿠키 삭제 실패 (이미 없을 수 있음)');
        }
      } catch (error) {
        console.log('⚠️ 쿠키 삭제 요청 실패:', error);
      }
      
      // 상태 리셋
      setUser(null);
      setError(null);
      console.log('✅ 모든 인증 정보 삭제 완료');
    };

    // 개발자 도움말 함수
    (window as any).devHelp = () => {
      console.log(`
🔧 개발자 도구 도움말:

📋 사용 가능한 함수들:
- devHelp()                    : 이 도움말 표시
- setDevToken("토큰")          : 개발용 토큰 설정
- debugAuth()                  : 현재 인증 상태 확인
- checkCookies()               : 쿠키 인증 상태 확인
- simulateAuthCallback()       : 통합로그인 콜백 시뮬레이션 (빠른 방법)
- testProtocolCallback()       : 실제 프로토콜 콜백 테스트 (디버깅용)
- clearAuth()                  : 모든 인증 정보 삭제
- testYouTubeAuth()           : 유튜브 인증 테스트

🚀 빠른 로그인 (개발용):
simulateAuthCallback()

🔧 수동 토큰 설정:
setDevToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzUzNzYwMzE1LCJleHAiOjE3NTYzNTIzMTV9.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w")

💡 문제 해결 가이드:
1. 🚀 빠른 로그인: simulateAuthCallback() 사용 (추천)
2. 🔧 프로토콜 디버깅: testProtocolCallback() 사용
3. 🍪 쿠키 문제 확인: checkCookies() 사용  
4. 🗑️ 완전 초기화: clearAuth() 후 다시 로그인
5. 🔍 현재 상태 확인: debugAuth() 사용

🚨 실제 로그인이 안 될 때:
- 외부 브라우저에서 로그인 완료 후 Electron 터미널에서 프로토콜 콜백 로그 확인
- 콜백이 안 오면: testProtocolCallback() 으로 테스트
- 그래도 안 되면: simulateAuthCallback() 으로 우회
      `);
    };
    
    // 프로토콜 콜백 테스트 함수
    (window as any).testProtocolCallback = (accessToken?: string, refreshToken?: string) => {
      console.log('🧪 프로토콜 콜백 테스트 시작...');
      
      const testTokens = {
        accessToken: accessToken || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzUzNzYwMzE1LCJleHAiOjE3NTYzNTIzMTV9.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w",
        refreshToken: refreshToken || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzUzNzYwMzE1LCJleHAiOjE3NTYzNTIzMTV9.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w"
      };
      
      console.log('📨 테스트 콜백 데이터:', {
        accessToken: testTokens.accessToken.substring(0, 20) + '...',
        refreshToken: testTokens.refreshToken.substring(0, 20) + '...'
      });
      
      if ((window as any).electron?.auth) {
        console.log('📡 Electron auth 객체를 통해 콜백 시뮬레이션');
        
        // 실제 프로토콜 콜백과 동일한 이벤트 발생
        if ((window as any).electron.auth.onAuthCallback) {
          // 이미 리스너가 설정되어 있다면 직접 호출
          console.log('🎯 기존 콜백 리스너로 이벤트 전송');
          
          // external-redirect 페이지가 아닌 경우 해당 페이지로 이동
          if (!window.location.pathname.includes('external-redirect')) {
            console.log('📍 external-redirect 페이지로 이동하여 콜백 처리');
            window.location.href = '/external-redirect';
            
            // 페이지 로드 후 콜백 실행을 위해 저장
            localStorage.setItem('pending-auth-callback', JSON.stringify(testTokens));
          } else {
            // 이미 external-redirect 페이지인 경우 직접 처리
            console.log('✅ 현재 페이지에서 직접 콜백 처리');
            setTimeout(() => {
              if ((window as any).electron?.auth?.onAuthCallback) {
                // 기존 리스너 제거 후 새로 설정
                (window as any).electron.auth.removeAuthCallback();
                (window as any).electron.auth.onAuthCallback((data: any) => {
                  console.log("🎉 테스트 콜백 수신:", data);
                });
              }
              
              // 실제 이벤트 발생 시뮬레이션
              const event = new CustomEvent('electron-auth-callback', { 
                detail: testTokens 
              });
              window.dispatchEvent(event);
            }, 100);
          }
        }
      } else {
        console.log('⚠️ Electron 환경이 아님, 브라우저 모드로 처리');
        (window as any).simulateAuthCallback(testTokens.accessToken, testTokens.refreshToken);
      }
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