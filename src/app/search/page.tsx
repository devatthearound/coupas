'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 홈페이지로 리다이렉트
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mb-4 mx-auto">
          <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">홈페이지로 이동 중...</p>
      </div>
    </div>
  );
} 