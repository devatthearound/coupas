'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export default function ApiSettingsPage() {
  // API 연동 설정 상태들
  const [apiSettings, setApiSettings] = useState({
    coupang: { accessKey: '', secretKey: '', enabled: false },
    aliexpress: { accessKey: '', secretKey: '', enabled: false },
    amazon: { accessKey: '', secretKey: '', enabled: false }
  });

  // API 설정 불러오기
  const loadApiSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/api-settings');
      const data = await response.json();
      
      if (data.success) {
        setApiSettings(data.data);
      } else {
        console.error('API 설정 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('API 설정 로드 중 오류:', error);
    }
  }, []);

  // API 설정 저장
  const saveApiSettings = async (platform: string, settings: any) => {
    try {
      const response = await fetch('/api/api-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          accessKey: settings.accessKey,
          secretKey: settings.secretKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApiSettings(prev => ({
          ...prev,
          [platform]: { ...settings, enabled: true }
        }));
        toast.success(`${platform.toUpperCase()} API 설정이 저장되었습니다!`);
      } else {
        toast.error(data.error || `${platform.toUpperCase()} API 설정 저장에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`${platform} API 설정 저장 오류:`, error);
      toast.error(`${platform.toUpperCase()} API 설정 저장에 실패했습니다.`);
    }
  };

  // 컴포넌트 마운트 시 API 설정 로드
  useEffect(() => {
    loadApiSettings();
  }, [loadApiSettings]);

  // API 플랫폼 정보
  const apiPlatforms = [
    { 
      key: 'coupang', 
      name: '쿠팡', 
      description: '쿠팡 파트너스 API 연동',
      icon: '🛒',
      color: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
      buttonColor: 'bg-red-500 hover:bg-red-600'
    },
    { 
      key: 'aliexpress', 
      name: '알리익스프레스', 
      description: 'AliExpress API 연동',
      icon: '🌐',
      color: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200',
      buttonColor: 'bg-orange-500 hover:bg-orange-600'
    },
    { 
      key: 'amazon', 
      name: '아마존', 
      description: 'Amazon API 연동',
      icon: '📦',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">API 연동 설정</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">쇼핑몰 API를 연동하여 상품 정보를 가져오세요</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {apiPlatforms.map((platform) => (
            <div key={platform.key} className={`p-4 rounded-lg border-2 ${platform.color}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <h3 className="font-semibold">{platform.name}</h3>
                  <p className="text-xs opacity-80">{platform.description}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Access Key</label>
                  <input
                    type="text"
                    value={apiSettings[platform.key as keyof typeof apiSettings].accessKey}
                    onChange={(e) => setApiSettings(prev => ({
                      ...prev,
                      [platform.key]: { ...prev[platform.key as keyof typeof prev], accessKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter access key"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={apiSettings[platform.key as keyof typeof apiSettings].secretKey}
                    onChange={(e) => setApiSettings(prev => ({
                      ...prev,
                      [platform.key]: { ...prev[platform.key as keyof typeof prev], secretKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter secret key"
                  />
                </div>
                <button
                  onClick={() => saveApiSettings(platform.key, apiSettings[platform.key as keyof typeof apiSettings])}
                  className={`w-full px-3 py-2 text-white text-sm rounded-md transition-colors ${platform.buttonColor}`}
                >
                  {apiSettings[platform.key as keyof typeof apiSettings].enabled ? '설정 업데이트' : '연동하기'}
                </button>
                
                {apiSettings[platform.key as keyof typeof apiSettings].enabled && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">연동 완료</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 도움말 섹션 */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">💡 API 설정 가이드</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• <strong>쿠팡 파트너스:</strong> 쿠팡 파트너스 센터에서 API 키를 발급받으세요</p>
            <p>• <strong>알리익스프레스:</strong> AliExpress Open Platform에서 API 키를 생성하세요</p>
            <p>• <strong>아마존:</strong> Amazon Associates API에서 인증 정보를 받으세요</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
