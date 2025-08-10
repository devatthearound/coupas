'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProductData } from '@/services/coupang/types';
import { 
  CheckCircleIcon, 
  PlayIcon, 
  ArrowPathIcon, 
  ArrowTopRightOnSquareIcon,
  FolderIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

export default function VideoCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [videoInfo, setVideoInfo] = useState<{
    title: string;
    path: string;
    keyword: string;
    products: ProductData[];
    outputDirectory: string;
  } | null>(null);

  useEffect(() => {
    const videoTitle = searchParams?.get('videoTitle');
    const videoPath = searchParams?.get('videoPath');
    const keyword = searchParams?.get('keyword');
    const productsParam = searchParams?.get('products');
    const outputDirectory = searchParams?.get('outputDirectory');

    if (videoTitle && videoPath) {
      let products: ProductData[] = [];
      if (productsParam) {
        try {
          products = JSON.parse(decodeURIComponent(productsParam));
        } catch (error) {
          console.error('상품 정보 파싱 실패:', error);
        }
      }

      setVideoInfo({
        title: decodeURIComponent(videoTitle),
        path: decodeURIComponent(videoPath),
        keyword: keyword ? decodeURIComponent(keyword) : '',
        products,
        outputDirectory: outputDirectory ? decodeURIComponent(outputDirectory) : ''
      });
    }
  }, [searchParams]);

  const handleOpenFolder = async () => {
    if (videoInfo?.outputDirectory && window.electron) {
      try {
        await window.electron.openFolder(videoInfo.outputDirectory);
      } catch (error) {
        console.error('폴더 열기 실패:', error);
        toast.error('폴더를 열 수 없습니다.');
      }
    }
  };

  const handlePlayVideo = () => {
    if (videoInfo?.path && window.electron) {
      try {
        window.electron.openExternal(videoInfo.path);
      } catch (error) {
        console.error('비디오 재생 실패:', error);
        toast.error('비디오를 재생할 수 없습니다.');
      }
    }
  };

  const handleCreateAnotherVideo = () => {
    router.push('/');
  };

  const handleGoToYoutube = () => {
    router.push('/video-upload');
  };

  if (!videoInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto">
            <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">영상 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 성공 메시지 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 영상 생성 완료!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            "{videoInfo.title}" 영상이 성공적으로 생성되었습니다.
          </p>
        </div>

        {/* 영상 정보 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <VideoCameraIcon className="w-6 h-6 text-[#514FE4] dark:text-[#6C63FF]" />
            생성된 영상 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">영상 제목</h3>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {videoInfo.title}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">키워드</h3>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {videoInfo.keyword || '키워드 없음'}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">포함된 상품</h3>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {videoInfo.products.length}개 상품
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">저장 위치</h3>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
                {videoInfo.outputDirectory || '위치 정보 없음'}
              </p>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 영상 재생 */}
          <button
            onClick={handlePlayVideo}
            className="bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] 
              text-white p-6 rounded-xl transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <PlayIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">영상 재생</h3>
                <p className="text-sm opacity-90">생성된 영상을 바로 확인해보세요</p>
              </div>
            </div>
          </button>

          {/* 폴더 열기 */}
          <button
            onClick={handleOpenFolder}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl 
              transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <FolderIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">폴더 열기</h3>
                <p className="text-sm opacity-90">영상이 저장된 폴더를 확인하세요</p>
              </div>
            </div>
          </button>

          {/* 유튜브 업로드 */}
          <button
            onClick={handleGoToYoutube}
            className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl 
              transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <ArrowTopRightOnSquareIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">유튜브 업로드</h3>
                <p className="text-sm opacity-90">생성된 영상을 유튜브에 업로드하세요</p>
              </div>
            </div>
          </button>

          {/* YouTube 관리 */}
          <button
            onClick={() => router.push('/youtube')}
            className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl 
              transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <div className="text-left">
                <h3 className="font-semibold text-lg">YouTube 관리</h3>
                <p className="text-sm opacity-90">업로드 히스토리 및 채널 관리</p>
              </div>
            </div>
          </button>
        </div>

        {/* 추가 액션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            다음 단계
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateAnotherVideo}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
                text-white p-4 rounded-lg transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex items-center justify-center gap-3">
                <ArrowPathIcon className="w-6 h-6 group-hover:rotate-180 transition-transform" />
                <div className="text-left">
                  <h3 className="font-semibold">다른 영상 만들기</h3>
                  <p className="text-sm opacity-90">새로운 키워드로 영상을 만들어보세요</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                text-white p-4 rounded-lg transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex items-center justify-center gap-3">
                <VideoCameraIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <h3 className="font-semibold">상품 관리</h3>
                  <p className="text-sm opacity-90">다른 상품들로 영상을 만들어보세요</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 팁 섹션 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            💡 팁
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>• 생성된 영상은 자동으로 유튜브에 업로드할 수 있습니다</li>
            <li>• 다른 키워드로 더 많은 영상을 만들어보세요</li>
            <li>• 영상 품질을 높이려면 템플릿 설정을 조정해보세요</li>
            <li>• 정기적으로 영상을 업로드하면 채널 성장에 도움이 됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
