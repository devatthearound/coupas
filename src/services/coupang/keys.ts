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
  const response = await fetch(`/api/coupang/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(keys),
  });

  const data = await response.json();

  return data || null;
}

// API 키 조회
export async function getCoupangApiKeys(): Promise<CoupangApiKeys | null> {
  try {
    const response = await fetch(`/api/coupang/keys`, {
      method: 'GET',
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
    const response = await fetch(`/api/coupang/keys/check`, {
      method: 'GET',
    });

    const data = await response.json();

    return data.exists;
  } catch (error) {
    return false;
  }
} 