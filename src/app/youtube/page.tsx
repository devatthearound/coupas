'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  PlayIcon, 
  ArrowUpTrayIcon, 
  CogIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function YoutubePage() {
  const router = useRouter();
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadHistory, setUploadHistory] = useState<Array<{
    id: string;
    title: string;
    status: 'success' | 'failed' | 'uploading';
    uploadedAt: string;
    videoId?: string;
  }>>([]);

  useEffect(() => {
    checkYoutubeConnection();
    loadUploadHistory();
  }, []);

  const checkYoutubeConnection = async () => {
    try {
      const response = await fetch('/api/google-auth/token');
      setIsYoutubeConnected(response.ok);
    } catch (error) {
      setIsYoutubeConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUploadHistory = async () => {
    // 실제로는 API에서 업로드 히스토리를 가져와야 함
    // 현재는 더미 데이터 사용
    setUploadHistory([
      {
        id: '1',
        title: '공기청정기 추천 영상',
        status: 'success',
        uploadedAt: '2024-01-15 14:30',
        videoId: 'abc123'
      },
      {
        id: '2',
        title: '로봇청소기 리뷰',
        status: 'success',
        uploadedAt: '2024-01-14 16:20',
        videoId: 'def456'
      }
    ]);
  };

  const handleConnectYoutube = () => {
    if (window.electron) {
      window.electron.openExternal(`${window.location.origin}/google-auth`);
    } else {
      window.open('/google-auth', '_blank');
    }
  };

  const handleUploadVideo = () => {
    router.push('/video-upload');
  };

  const handleCreateVideo = () => {
    router.push('/');
  };

  const handleOpenVideo = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    if (window.electron) {
      window.electron.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto">
            <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">유튜브 연결 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            YouTube 관리
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            생성된 영상을 YouTube에 업로드하고 관리하세요
          </p>
        </div>

        {/* 연결 상태 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isYoutubeConnected 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {isYoutubeConnected ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  YouTube 연결 상태
                </h2>
                <p className={`text-sm ${
                  isYoutubeConnected 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {isYoutubeConnected ? '연결됨' : '연결되지 않음'}
                </p>
              </div>
            </div>
            
            {!isYoutubeConnected && (
              <button
                onClick={handleConnectYoutube}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg 
                  transition-colors font-medium flex items-center gap-2"
              >
                <CogIcon className="w-5 h-5" />
                YouTube 연결하기
              </button>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 영상 만들기 */}
          <button
            onClick={handleCreateVideo}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
              text-white p-6 rounded-xl transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <PlayIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">영상 만들기</h3>
                <p className="text-sm opacity-90">새로운 제휴 영상을 만들어보세요</p>
              </div>
            </div>
          </button>

          {/* 영상 업로드 */}
          <button
            onClick={handleUploadVideo}
            disabled={!isYoutubeConnected}
            className={`p-6 rounded-xl transition-all duration-200 hover:shadow-lg group ${
              isYoutubeConnected
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <ArrowUpTrayIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">영상 업로드</h3>
                <p className="text-sm opacity-90">
                  {isYoutubeConnected ? '생성된 영상을 YouTube에 업로드하세요' : 'YouTube 연결이 필요합니다'}
                </p>
              </div>
            </div>
          </button>

          {/* 설정 */}
          <button
            onClick={() => router.push('/settings')}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
              text-white p-6 rounded-xl transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <CogIcon className="w-8 h-8 group-hover:rotate-180 transition-transform" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">설정</h3>
                <p className="text-sm opacity-90">템플릿 및 API 설정을 관리하세요</p>
              </div>
            </div>
          </button>
        </div>

        {/* 업로드 히스토리 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            업로드 히스토리
          </h2>
          
          {uploadHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <ArrowUpTrayIcon className="w-full h-full" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                아직 업로드된 영상이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadHistory.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      video.status === 'success' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : video.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/20'
                        : 'bg-yellow-100 dark:bg-yellow-900/20'
                    }`}>
                      {video.status === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : video.status === 'failed' ? (
                        <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {video.uploadedAt}
                      </p>
                    </div>
                  </div>
                  
                  {video.status === 'success' && video.videoId && (
                    <button
                      onClick={() => handleOpenVideo(video.videoId!)}
                      className="text-[#514FE4] dark:text-[#6C63FF] hover:text-[#4140B3] dark:hover:text-[#5B54E8] 
                        font-medium text-sm flex items-center gap-1"
                    >
                      <PlayIcon className="w-4 h-4" />
                      보기
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 팁 섹션 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            💡 YouTube 업로드 팁
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>• 정기적으로 영상을 업로드하면 채널 성장에 도움이 됩니다</li>
            <li>• 제목과 설명에 키워드를 포함하면 검색 노출이 높아집니다</li>
            <li>• 썸네일을 매력적으로 만들어 클릭률을 높이세요</li>
            <li>• 댓글에 답변하고 시청자와 소통하면 구독자 수가 늘어납니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}