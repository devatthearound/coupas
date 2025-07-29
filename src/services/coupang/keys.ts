import { fetchWrapper } from '@/utils/fetchWrapper';

interface CoupangApiKeys {
  accessKey: string;
  secretKey: string;
}

interface ApiResponse {
  message: string;
  data?: CoupangApiKeys;
}

// API 키 저장/수정
export async function saveCoupangApiKeys(keys: CoupangApiKeys): Promise<ApiResponse> {
  // 개발 환경에서는 토큰에서 사용자 ID 추출
  let userId = null;
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('coupas_access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (error) {
        console.error('토큰 디코딩 오류:', error);
      }
    }
    
    // 기존 user 데이터도 확인
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    if (!userId && user?.id) {
      userId = user.id;
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 사용자 ID가 있으면 헤더에 추가
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(`/api/coupang/keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify(keys),
  });

  const data = await response.json();

  return data || null;
}

// API 키 조회
export async function getCoupangApiKeys(): Promise<CoupangApiKeys | null> {
  try {
    // 개발 환경에서는 토큰에서 사용자 ID 추출
    let userId = null;
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('coupas_access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch (error) {
          console.error('토큰 디코딩 오류:', error);
        }
      }
      
      // 기존 user 데이터도 확인
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      if (!userId && user?.id) {
        userId = user.id;
      }
    }
    
    const headers: Record<string, string> = {};
    
    // 사용자 ID가 있으면 헤더에 추가
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`/api/coupang/keys`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return data.data || null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// API 키 삭제
export async function deleteCoupangApiKeys(): Promise<ApiResponse> {
  const response = await fetch(`/api/coupang/keys`, {
    method: 'DELETE',
  });

  const data = await response.json();

  return data || null;
}

// API 키 존재 여부 확인
export async function checkCoupangApiKeys(): Promise<boolean> {
  try {
    // 개발 환경에서는 토큰에서 사용자 ID 추출
    let userId = null;
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('coupas_access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch (error) {
          console.error('토큰 디코딩 오류:', error);
        }
      }
      
      // 기존 user 데이터도 확인
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      if (!userId && user?.id) {
        userId = user.id;
      }
    }
    
    if (!userId) {
      return false; // 사용자가 로그인하지 않은 경우
    }
    
    const headers: Record<string, string> = {
      'x-user-id': userId
    };

    const response = await fetch(`/api/coupang/keys/check`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return data.exists;
  } catch (error) {
    return false;
  }
} 