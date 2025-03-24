import { isElectron } from '@/utils/environment';

export const generateAuthRedirectUrl = (currentPath: string, type: 'login' | 'google-auth' = 'login') => {
  if (isElectron()) {
    const electronPath = encodeURIComponent(`coupas-auth://${type}`);
    const growsomeUrl = `https://growsome.kr/${type}?redirect_to=${electronPath}`;
    return `/external-redirect?url=${encodeURIComponent(growsomeUrl)}`;
  }

  const redirectTo = encodeURIComponent(`${process.env.NEXT_PUBLIC_COUPAS_BASE_PATH}/${currentPath}`);
  return `${process.env.NEXT_PUBLIC_GROWSOME_BASE_PATH}/${type}?redirect_to=${redirectTo}`;
}; 