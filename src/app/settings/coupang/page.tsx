'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getCoupangApiKeys, saveCoupangApiKeys } from '@/services/coupang/keys';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const keys = await getCoupangApiKeys();
        if (keys) {
          setAccessKey(keys.accessKey);
          setSecretKey(keys.secretKey);
        }
      } catch (error) {
        console.error('API 키 로드 중 오류:', error);
      }
    };

    loadApiKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim() || !secretKey.trim()) {
      toast.error('Access Key와 Secret Key를 모두 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      await saveCoupangApiKeys({
        accessKey: accessKey.trim(),
        secretKey: secretKey.trim()
      });
      
      toast.success(
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>API 키가 성공적으로 저장되었습니다</span>
          <button
            onClick={() => router.push('/search')}
            className="text-[#514FE4] hover:text-[#4140B3] dark:text-[#6C63FF] dark:hover:text-[#5B54E8] font-medium"
          >
            영상만들기
          </button>
        </div>,
        {
          duration: 5000,
          style: {
            minWidth: 'auto',
            maxWidth: 'none'
          }
        }
      );
    } catch (error) {
      console.error('API 키 저장 중 오류:', error);
      toast.error('API 키 저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API 설정
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            쿠팡 파트너스 API 키를 설정하여 상품 검색 기능을 사용할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Access Key
            </label>
            <input
              type="text"
              id="accessKey"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-[#514FE4] dark:focus:ring-[#6C63FF] focus:border-transparent
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="쿠팡 파트너스 Access Key를 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Secret Key
            </label>
            <input
              type="password"
              id="secretKey"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-[#514FE4] dark:focus:ring-[#6C63FF] focus:border-transparent
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="쿠팡 파트너스 Secret Key를 입력하세요"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] 
                dark:hover:bg-[#5B54E8] text-white rounded-lg transition-colors"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 