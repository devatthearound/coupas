type FetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;  // 인증 리다이렉트를 건너뛰어야 하는 경우
};


export const fetchWrapper = async (url: string, options?: FetchOptions) => {
  try {
    const response = await fetch(url, options);

    
    // API 응답 처리
    if (!response.ok) {
      // 401 처리 (인증 실패)
      if (response.status === 401 && !options?.skipAuthRedirect) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
          // 리다이렉트 후 Promise를 pending 상태로 유지
          return new Promise(() => {});
        }
      }

      // 403 처리 (권한 없음)
      if (response.status === 403) {
        const data = await response.json();
        if (data.code === 'NO_VALID_TICKET' && data.redirectUrl) {
          window.location.href = data.redirectUrl;
          // 리다이렉트 후 Promise를 pending 상태로 유지
          return new Promise(() => {});
        }
        throw new Error('결제가 필요합니다.');
      }
    }

    return handleResponse(response);
  } catch (error) {
    console.error('[fetchWrapper] Error:', error);
    throw error;
  }
};

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  if (!response.ok) {
    if (isJson) {
      const data = await response.json();
      throw new Error(data.error || 'API request failed');
    }
    throw new Error('API request failed');
  }

  return isJson ? response.json() : response.text();
};

// 사용 예시
export const api = {
  get: (url: string, options?: FetchOptions) => 
    fetchWrapper(url, { ...options, method: 'GET' }),
  
  post: (url: string, body: any, options?: FetchOptions) => 
    fetchWrapper(url, { 
      ...options, 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),
  
  delete: (url: string, options?: FetchOptions) =>
    fetchWrapper(url, { ...options, method: 'DELETE' }),
}; 