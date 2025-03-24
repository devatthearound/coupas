/**
 * 현재 실행 환경이 일렉트론인지 확인하는 함수
 */
export const isElectron = (): boolean => {
  // 브라우저 환경이 아닌 경우 (SSR)
  if (typeof window === 'undefined') {
    return false;
  }

  // electron window 객체 존재 여부 확인
  const isElectronWindow = !!(window as any).electron;
  
  // userAgent에서 electron 문자열 확인
  const isElectronUserAgent = window.navigator.userAgent.toLowerCase().includes('electron');
  
  // process 객체를 통한 확인 (electron 환경에서만 존재)
  const isElectronProcess = !!(window as any).process?.versions?.electron;

  return isElectronWindow || isElectronUserAgent || isElectronProcess;
};

/**
 * 현재 실행 환경이 개발 모드인지 확인하는 함수
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * 현재 실행 환경에 대한 상세 정보를 반환하는 함수
 */
export const getEnvironmentInfo = () => {
  const isElectronEnv = isElectron();
  const isDev = isDevelopment();

  return {
    isElectron: isElectronEnv,
    isDevelopment: isDev,
    platform: isElectronEnv ? (window as any).electron?.platform : 'web',
    environment: isDev ? 'development' : 'production',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  };
};

/**
 * 현재 실행 환경을 문자열로 반환하는 함수
 */
export const getEnvironmentType = (): 'electron' | 'web' | 'server' => {
  if (typeof window === 'undefined') {
    return 'server';
  }
  return isElectron() ? 'electron' : 'web';
}; 