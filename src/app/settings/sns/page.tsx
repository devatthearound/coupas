'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { isElectron } from '@/utils/environment';

export default function SnsSettingsPage() {
  // SNS 연동 설정 상태들
  const [snsSettings, setSnsSettings] = useState({
    youtube: { connected: false, email: '' },
    threads: { connected: false, username: '', accountId: '' },
    instagram: { connected: false, username: '' },
    facebook: { connected: false, pageId: '' }
  });

  // SNS 설정 불러오기
  const loadSnsSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/sns-settings');
      const data = await response.json();
      
      if (data.success) {
        setSnsSettings(data.data);
      } else {
        console.error('SNS 설정 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('SNS 설정 로드 중 오류:', error);
    }
  }, []);

  // SNS 설정 저장
  const saveSnsSettings = useCallback(async (platform: string, settings: any) => {
    try {
      const response = await fetch('/api/sns-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          ...settings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSnsSettings(prev => ({
          ...prev,
          [platform]: settings
        }));
      } else {
        console.error('SNS 설정 저장 실패:', data.error);
      }
    } catch (error) {
      console.error('SNS 설정 저장 중 오류:', error);
    }
  }, []);

  // 유튜브 연동 상태 확인
  const checkYoutubeStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/google-auth/token');
      if (response.ok) {
        const youtubeSettings = { connected: true, email: 'Connected' };
        
        setSnsSettings(prev => ({
          ...prev,
          youtube: youtubeSettings
        }));
        
        // SNS 설정 파일에도 저장
        await saveSnsSettings('youtube', youtubeSettings);
      }
    } catch (error) {
      console.log('유튜브 연동 상태 확인 중 오류:', error);
    }
  }, [saveSnsSettings]);

  // 인스타그램 연동 상태 확인
  const checkInstagramStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/instagram-auth');
      if (response.ok) {
        const data = await response.json();
        const instagramSettings = {
          connected: true, 
          username: data.user.username 
        };
        
        setSnsSettings(prev => ({
          ...prev,
          instagram: instagramSettings
        }));
        
        // SNS 설정 파일에도 저장
        await saveSnsSettings('instagram', instagramSettings);
      }
    } catch (error) {
      console.log('인스타그램 연동 상태 확인 중 오류:', error);
    }
  }, [saveSnsSettings]);

  // SNS 연동 처리
  const handleSnsConnect = async (platform: string) => {
    try {
      switch (platform) {
        case 'youtube':
          // 임시로 로컬 인증 사용 (growsome.kr 엔드포인트 준비 전까지)
          if (isElectron()) {
            // Electron에서는 로컬 브라우저 창으로 열기
            window.electron.openExternal(`${window.location.origin}/google-auth`);
          } else {
            window.open(`${window.location.origin}/google-auth`, '_blank');
          }
          
                     // 인증 상태 폴링 시작
           const authCheckInterval = setInterval(async () => {
             try {
               const response = await fetch('/api/google-auth/token');
               if (response.ok) {
                 console.log('유튜브 인증이 완료되었습니다.');
                 const youtubeSettings = { connected: true, email: 'Connected' };
                 
                 setSnsSettings(prev => ({
                   ...prev,
                   youtube: youtubeSettings
                 }));
                 
                 // SNS 설정 파일에도 저장
                 await saveSnsSettings('youtube', youtubeSettings);
                 
                 toast.success('유튜브 연동이 완료되었습니다!');
                 clearInterval(authCheckInterval);
               }
             } catch (error) {
               console.log('인증 상태 확인 중 오류:', error);
             }
           }, 2000);
          
          // 30초 후 폴링 중단
          setTimeout(() => {
            clearInterval(authCheckInterval);
          }, 30000);
          break;
        case 'threads':
          // 스래드 연동 로직 (추후 구현)
          toast('스래드 연동은 준비 중입니다.', { icon: 'ℹ️' });
          break;
        case 'instagram':
          // 인스타그램 연동 로직
          const instagramClientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || 'your-instagram-client-id';
          const redirectUri = encodeURIComponent(`${window.location.origin}/instagram-auth/callback`);
          const scope = 'user_profile,user_media';
          
          const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
          
          // 팝업 창으로 인증 시작
          const popup = window.open(
            instagramAuthUrl,
            'instagram-auth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );

                    // 팝업 메시지 리스너
          const messageListener = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'INSTAGRAM_AUTH_SUCCESS') {
              const instagramSettings = { 
                connected: true, 
                username: event.data.user.username 
              };
              
              setSnsSettings(prev => ({
                ...prev,
                instagram: instagramSettings
              }));
              
              // SNS 설정 파일에도 저장
              await saveSnsSettings('instagram', instagramSettings);
              
              toast.success('인스타그램 연동이 완료되었습니다!');
              window.removeEventListener('message', messageListener);
              if (popup) popup.close();
            }
          };

          window.addEventListener('message', messageListener);

          // 팝업이 닫혔는지 확인하는 인터벌
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
            }
          }, 1000);
          break;
        case 'facebook':
          // 페이스북 연동 로직 (추후 구현)
          toast('페이스북 연동은 준비 중입니다.', { icon: 'ℹ️' });
          break;
      }
    } catch (error) {
      console.error(`${platform} 연동 오류:`, error);
      toast.error(`${platform} 연동에 실패했습니다.`);
    }
  };

  // SNS 연동 해제
  const handleSnsDisconnect = async (platform: string) => {
    try {
      if (platform === 'youtube') {
        // 유튜브 연동 해제 API 호출
        const response = await fetch('/api/google-auth', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const youtubeSettings = { connected: false, email: '' };
          setSnsSettings(prev => ({
            ...prev,
            youtube: youtubeSettings
          }));
          await saveSnsSettings('youtube', youtubeSettings);
          toast.success('유튜브 연동이 해제되었습니다.');
        } else {
          toast.error('유튜브 연동 해제에 실패했습니다.');
        }
      } else if (platform === 'instagram') {
        // 인스타그램 연동 해제 API 호출
        const response = await fetch('/api/instagram-auth', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const instagramSettings = { connected: false, username: '' };
          setSnsSettings(prev => ({
            ...prev,
            instagram: instagramSettings
          }));
          await saveSnsSettings('instagram', instagramSettings);
          toast.success('인스타그램 연동이 해제되었습니다.');
        } else {
          toast.error('인스타그램 연동 해제에 실패했습니다.');
        }
      } else {
        // 다른 플랫폼은 로컬 상태만 업데이트
        const platformSettings = { ...snsSettings[platform as keyof typeof snsSettings], connected: false };
        setSnsSettings(prev => ({
          ...prev,
          [platform]: platformSettings
        }));
        await saveSnsSettings(platform, platformSettings);
        toast.success(`${platform} 연동이 해제되었습니다.`);
      }
    } catch (error) {
      console.error(`${platform} 연동 해제 오류:`, error);
      toast.error(`${platform} 연동 해제에 실패했습니다.`);
    }
  };

  // 컴포넌트 마운트 시 SNS 설정 로드
  useEffect(() => {
    loadSnsSettings();
    checkYoutubeStatus();
    checkInstagramStatus();
  }, [loadSnsSettings, checkYoutubeStatus, checkInstagramStatus]);

  // SNS 플랫폼 정보
  const snsPlatforms = [
    { 
      key: 'youtube', 
      name: '유튜브', 
      description: '유튜브 채널 연동',
      icon: '🎥',
      color: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
      buttonColor: 'bg-red-500 hover:bg-red-600'
    },
    { 
      key: 'threads', 
      name: '스래드', 
      description: '스래드 계정 연동',
      icon: '🧵',
      color: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200',
      buttonColor: 'bg-purple-500 hover:bg-purple-600'
    },
    { 
      key: 'instagram', 
      name: '인스타그램', 
      description: '인스타그램 계정 연동',
      icon: '📸',
      color: 'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-200',
      buttonColor: 'bg-pink-500 hover:bg-pink-600'
    },
    { 
      key: 'facebook', 
      name: '페이스북', 
      description: '페이스북 페이지 연동',
      icon: '👥',
      color: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
      buttonColor: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">SNS 연동 설정</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">소셜 미디어 계정을 연동하여 콘텐츠를 공유하세요</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {snsPlatforms.map((platform) => (
            <div key={platform.key} className={`p-4 rounded-lg border-2 ${platform.color}`}>
              <div className="text-center">
                <span className="text-3xl mb-2 block">{platform.icon}</span>
                <h3 className="font-semibold mb-1">{platform.name}</h3>
                <p className="text-xs opacity-80 mb-4">{platform.description}</p>
                
                {snsSettings[platform.key as keyof typeof snsSettings].connected ? (
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs mb-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>연동됨</span>
                      </div>
                      {(platform.key === 'instagram' && snsSettings.instagram.username) && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          @{snsSettings.instagram.username}
                        </div>
                      )}
                      {(platform.key === 'youtube' && snsSettings.youtube.email) && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {snsSettings.youtube.email}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleSnsDisconnect(platform.key)}
                      className="w-full px-3 py-2 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      연동 해제
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSnsConnect(platform.key)}
                    className={`w-full px-3 py-2 text-xs text-white rounded-md transition-colors ${platform.buttonColor}`}
                  >
                    연동하기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 도움말 섹션 */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">💡 SNS 연동 가이드</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• <strong>유튜브:</strong> Google 계정으로 로그인하여 영상 업로드 권한을 부여하세요</p>
            <p>• <strong>스래드:</strong> Meta 계정을 통해 스래드 게시물을 공유할 수 있습니다</p>
            <p>• <strong>인스타그램:</strong> Instagram Basic Display API를 통해 계정을 연동하세요</p>
            <p>• <strong>페이스북:</strong> Facebook 페이지에 콘텐츠를 게시할 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  );
} 