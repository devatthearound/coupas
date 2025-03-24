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

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_COUPAS_API_PATH}/api/user/me`, {
        credentials: 'include',
      });

      const data = await response.json();
      
      // authenticated 필드로 인증 상태 확인
      if (data.authenticated) {
        setUser(data.user);
      } else {
        // 인증되지 않은 경우 사용자 정보는 null로 설정
        setUser(null);
        // 에러 메시지가 있으면 설정 (선택적)
        if (data.message) {
          setError(data.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  // 로그아웃 함수
  const logout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_COUPAS_API_PATH}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      window.location.href = `${process.env.NEXT_PUBLIC_COUPAS_BASE_PATH}/`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  // 사용자 정보 업데이트 함수
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // 초기 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    fetchUser();
  }, []);

  // 컨텍스트 값
  const value = {
    user,
    isLoading,
    error,
    fetchUser,
    logout,
    updateUser,
  };

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