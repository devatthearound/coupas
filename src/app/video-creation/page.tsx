'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProductData } from '../types';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import {  DropResult } from 'react-beautiful-dnd';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { isElectron } from '@/utils/environment';

export default function VideoCreationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoCreationContent />
    </Suspense>
  );
}

function VideoCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  // 상품정보 JSON으로 사용자 입력 받기
  const [productInfo, setProductInfo] = useState<string>('');
  // 비디오 제목
  const [videoTitle, setVideoTitle] = useState('');
  // 비디오 설명
  const [description, setDescription] = useState('example description');
  // 비디오 태그
  const [tags, setTags] = useState('example, tags');
  // 인트로 영상 파일
  const [introVideo, setIntroVideo] = useState<string | null>(null);
  // 아웃로 영상 파일
  const [outroVideo, setOutroVideo] = useState<string | null>(null);
  // 배경 음악 파일
  const [backgroundMusic, setBackgroundMusic] = useState<string>('');
  // 배경 템플릿 이미지 파일
  const [backgroundTemplatePath, setBackgroundTemplatePath] = useState<string>('');

  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<string>('default');
  const [commentTemplate, setCommentTemplate] = useState<'template1' | 'template2'>('template1');
  
  const [progress, setProgress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);


  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // 업로드 진행 상태를 더 자세히 표시하기 위한 상태 추가
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [customComments, setCustomComments] = useState<string>('');

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    title: string;
    description: string;
    tags: string[];
    thumbnailPath: string;
  } | null>(null);

  const skinOptions = [
    { label: '기본 스킨', value: 'default', description: '깔끔한 기본 디자인' },
    // { label: '모던 스킨', value: 'modern', description: '세련된 모던 디자인' },
    // { label: '미니멀 스킨', value: 'minimal', description: '심플한 미니멀 디자인' },
    // { label: '다이나믹 스킨', value: 'dynamic', description: '화려한 모션 디자인' },
  ];

  const handleIntroVideoChange = async () => {
    try {
      const filePath = await window.electron.selectVideoFile();
      if (filePath) {
        setIntroVideo(filePath);
      }
    } catch (error) {
      console.error('첫 번째 비디오 선택 중 오류:', error);
    }
  };

  const handleOutroVideoChange = async () => {
    try {
      const filePath = await window.electron.selectVideoFile();
      if (filePath) {
        setOutroVideo(filePath);
      }
    } catch (error) {
      console.error('두 번째 비디오 선택 중 오류:', error);
    }
  };

  const handleSelectAudio = async () => {
    try {
      const filePath = await window.electron.selectAudioFile();
      if (filePath) {
        setBackgroundMusic(filePath);
      } 
    } catch (error) {
      console.error('오디오 선택 중 오류:', error);
    }
  };
  
  const handleSkinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSkin(e.target.value);
  };


  useEffect(() => {
    const isElectronEnv = isElectron();

    if (isElectronEnv) {
      window.electron.auth.onGoogleAuthCallback((data) => {
        console.log('Google Auth Callback:', data);
        setIsAuthenticating(false);
        // 대기 중인 업로드 데이터가 있다면 업로드 재시도
        if (pendingUploadData) {
          uploadToYoutube(pendingUploadData);
          setPendingUploadData(null);
        }
      });
    }
  }, [pendingUploadData]);

  const uploadToYoutube = useCallback(async (uploadData: {
    title: string;
    description: string;
    tags: string[];
    thumbnailPath: string;
  }) => {
    if (!generatedVideoUrl) {
      toast.error('먼저 영상을 생성해주세요.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('구글 인증 상태 확인 중...');
      setUploadProgress(10);

      const response = await fetch('/api/google-auth/token');
      
      if (!response.ok) {
        toast.error('유튜브 로그인이 필요합니다.');
        setIsAuthenticating(true);
        setPendingUploadData(uploadData);
        const redirect_to = encodeURIComponent('coupas-auth://google-auth/success');
        window.electron.openExternal(`https://growsome.kr/coupas/google-auth?redirect_to=${redirect_to}`);
        return;
      }

      setUploadStatus('유튜브에 업로드 준비 중...');
      setUploadProgress(30);
      const authData = await response.json();

      setUploadStatus('영상 업로드 중...');
      setUploadProgress(50);
      
      const result = await window.electron.uploadVideo(
        authData.data,
        uploadData.title,
        uploadData.description,
        uploadData.tags,
        generatedVideoUrl,
        uploadData.thumbnailPath
      );

      if (result.success) {
        setUploadProgress(100);
        setUploadStatus('업로드 완료!');
        toast.success('유튜브 업로드가 완료되었습니다!');
        setIsPreviewModalOpen(false);
      } else {
        if (result.error?.includes('Invalid Credentials')) {
          toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
          router.push('/google-auth');
          return;
        }
        throw new Error(result.error || '업로드 실패');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
      setUploadProgress(0);
    }
  }, [generatedVideoUrl, router]);


  const saveLocally = async () => {
    if (!generatedVideoUrl) {
      toast.error('먼저 영상을 생성해주세요.');
      return;
    }

    const a = document.createElement('a');
    a.href = generatedVideoUrl;
    a.download = 'generated-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('영상이 로컬에 저장되었습니다!');
  };

  const handleBackgroundTemplateChange = async () => {
    const filePath = await window.electron.selectImageFile();
    if (filePath) {
      console.log('선택된 배경 템플릿 이미지 경로:', filePath);
      setBackgroundTemplatePath(filePath);
    }
  };

  const generateVideo = async () => {
    if(!videoTitle) {
      toast.error('영상 제목을 입력해주세요.');
      return;
    }
    if(!productInfo) {
      toast.error('상품 정보를 입력해주세요.');
      return;
    }
    if(!introVideo) {
      toast.error('인트로 영상을 선택해주세요.');
      return;
    }
    if(!outroVideo) {
      toast.error('아웃로 영상을 선택해주세요.');
      return;
    }
    if(!backgroundMusic) {
      toast.error('배경 음악을 선택해주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress('비디오와 이미지를 합치는 중...');
      
      // 파일 경로 로그 추가
      console.log('비디오 생성 시작: ', {
        videoTitle,
        introVideo,
        outroVideo,
        backgroundMusic,
        backgroundTemplatePath
      });
      
      // 상품 정보 파싱 시도
      let parsedProductInfo;
      try {
        parsedProductInfo = JSON.parse(productInfo);
        console.log('파싱된 상품 정보:', parsedProductInfo);
      } catch (parseError) {
        console.error('상품 정보 파싱 오류:', parseError);
        toast.error('상품 정보 JSON 형식이 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }
      
      const result = await window.electron.combineVideosAndImages(
        videoTitle,
        introVideo,
        outroVideo,
        backgroundMusic,
        backgroundTemplatePath,
        parsedProductInfo
      );

      console.log('비디오 합성 결과:', result);

      if (result.success) {
        setProgress('');
        // 생성된 비디오 경로 저장
        if(result.outputPath) {
          setGeneratedVideoUrl(result.outputPath);
        }
        toast.success('비디오 합성이 완료되었습니다!');
      } else {
        setProgress('');
        console.error('합성 실패 상세 오류:', result.error);
        toast.error(`합성 실패: ${result.error}`);
      }
    } catch (error) {
      setProgress('');
      console.error('비디오 합성 중 오류:', error);
      toast.error('비디오 합성 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (selectedProducts.length > 0) {
      params.set('products', encodeURIComponent(JSON.stringify(selectedProducts)));
    }
    router.push(`/search?${params.toString()}`);
  };

  const generateComment = useCallback((): string => {
    if (!productInfo) return '';

    try {
      const products = JSON.parse(productInfo);
      const header = "이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.\n\n";
      
      const templates = {
        template1: (product: any, index: number) => 
          `🏆 ${product.rank}위 ${product.productName}\n` +
          `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
          `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
          `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
          `\n구매링크: ${product.shortUrl}\n`,

        template2: (product: any, index: number) =>
          `💫 ${product.rank}위 추천! ${product.productName}\n` +
          `💰 특가: ${product.productPrice.toLocaleString()}원\n` +
          `${product.isRocket ? '🚀 로켓배송으로 빠른배송\n' : ''}` +
          `${product.isFreeShipping ? '무료배송 가능\n' : ''}` +
          `\n상세정보 👉 ${product.shortUrl}\n`
      };

      const productsText = products.map((product: any, index: number) => 
        templates[commentTemplate](product, index)
      ).join('\n');

      const footer = '\n#쿠팡 #최저가 #추천상품 #쇼핑';

      return header + productsText + footer;
    } catch (error) {
      console.error('상품 정보 파싱 오류:', error);
      return '';
    }
  }, [productInfo, commentTemplate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <VideoPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        videoUrl={generatedVideoUrl || ''}
        onYoutubeUpload={uploadToYoutube}
        onLocalDownload={saveLocally}
        comments={generateComment()}  
        commentTemplate={commentTemplate}
        onCommentTemplateChange={setCommentTemplate}
        onCommentsChange={setCustomComments}
      />

      {/* Progress Overlay - visible only when processing */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              {/* Spinner Animation */}
              <div className="w-16 h-16 mb-4">
                <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              
              {/* Progress Text */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                영상 생성 중...
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                {progress || '처리 중...'}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full animate-pulse"></div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                처리 시간은 파일 크기에 따라 달라집니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 중 오버레이 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              {/* 업로드 아이콘 애니메이션 */}
              <div className="w-16 h-16 mb-4 relative">
                <svg 
                  className="animate-bounce w-full h-full text-[#514FE4] dark:text-[#6C63FF]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
              </div>
              
              {/* 업로드 상태 텍스트 */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {uploadStatus || '업로드 중...'}
              </h3>
              
              {/* 진행 상태 바 */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                업로드가 완료될 때까지 페이지를 닫지 말아주세요
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 구글 인증 오버레이 */}
      {isAuthenticating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4">
                <svg 
                  className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                구글 계정 인증 중...
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                외부 브라우저에서 구글 로그인을 완료해주세요.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                인증이 완료되면 자동으로 업로드가 진행됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">영상 생성</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">3/3 단계</div>
        </div>

        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                영상 제목
              </label>
              <input 
                type="text" 
                value={videoTitle} 
                onChange={(e) => setVideoTitle(e.target.value)}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  border border-gray-200 dark:border-gray-700 rounded-md
                  py-2 px-3 focus:outline-none
                  focus:border-[#514FE4] dark:focus:border-[#6C63FF]
                  focus:ring-1 focus:ring-[#514FE4]/50 dark:focus:ring-[#6C63FF]/50
                  transition-colors"
                placeholder="영상 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                인트로 영상 선택
              </label>
              <button
                onClick={handleIntroVideoChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 rounded text-left transition-colors"
              >
                <span className="inline-block mr-4 py-2 px-4
                  rounded-full border-0
                  text-sm font-semibold
                  bg-[#514FE4]/10 text-[#514FE4]
                  dark:bg-[#6C63FF]/10 dark:text-[#6C63FF]
                  hover:bg-[#514FE4]/20">
                  파일 선택
                </span>
                {introVideo ? introVideo.split('/').pop() : '선택된 파일 없음'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                아웃트로 영상 선택
              </label>
              <button
                onClick={handleOutroVideoChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 rounded text-left transition-colors"
              >
                <span className="inline-block mr-4 py-2 px-4
                  rounded-full border-0
                  text-sm font-semibold
                  bg-[#514FE4]/10 text-[#514FE4]
                  dark:bg-[#6C63FF]/10 dark:text-[#6C63FF]
                  hover:bg-[#514FE4]/20">
                  파일 선택
                </span>
                {outroVideo ? outroVideo.split('/').pop() : '선택된 파일 없음'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비디오 스킨 선택
              </label>
              <div className="grid grid-cols-2 gap-3">
                {skinOptions.map((skin) => (
                  <label
                    key={skin.value}
                    className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedSkin === skin.value 
                        ? 'border-[#514FE4] dark:border-[#6C63FF] bg-[#514FE4]/5 dark:bg-[#6C63FF]/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <input
                      type="radio"
                      name="skin"
                      value={skin.value}
                      checked={selectedSkin === skin.value}
                      onChange={() => setSelectedSkin(skin.value)}
                      className="absolute opacity-0"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {skin.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {skin.description}
                      </span>
                    </div>
                    {selectedSkin === skin.value && (
                      <div className="absolute top-2 right-2 text-[#514FE4] dark:text-[#6C63FF]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                배경 음악 선택
              </label>
              <button
                onClick={handleSelectAudio}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 rounded text-left transition-colors"
              >
                <span className="inline-block mr-4 py-2 px-4
                  rounded-full border-0
                  text-sm font-semibold
                  bg-[#514FE4]/10 text-[#514FE4]
                  dark:bg-[#6C63FF]/10 dark:text-[#6C63FF]
                  hover:bg-[#514FE4]/20">
                  파일 선택
                </span>
                {backgroundMusic ? backgroundMusic.split('/').pop() : '선택된 파일 없음'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                배경 템플릿 이미지 선택
              </label>
              <button
                onClick={handleBackgroundTemplateChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 rounded text-left transition-colors"
              >
                <span className="inline-block mr-4 py-2 px-4
                  rounded-full border-0 
                  text-sm font-semibold
                  bg-[#514FE4]/10 text-[#514FE4]
                  dark:bg-[#6C63FF]/10 dark:text-[#6C63FF]
                  hover:bg-[#514FE4]/20">
                  파일 선택
                </span>
                {backgroundTemplatePath ? backgroundTemplatePath.split('/').pop() : '선택된 파일 없음'}
              </button>
            </div>

            {/* 상품 정보 JSON 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상품 정보 JSON
              </label>
              <textarea
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                className="block w-full h-40 text-sm text-gray-500 dark:text-gray-400
                  border border-gray-200 dark:border-gray-700 rounded-md
                  py-2 px-3 focus:outline-none
                  focus:border-[#514FE4] dark:focus:border-[#6C63FF]
                  transition-colors"
                placeholder={`올바른 JSON 형식으로 상품 정보를 입력해주세요:
[
  {
    "productName": "상품명",
    "productPrice": 10000,
    "productImage": "https://example.com/image.jpg",
    "isRocket": true,
    "isFreeShipping": false,
    "shortUrl": "https://example.com"
  }
]`}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                * 쉼표(,)와 따옴표(`&quot;`)를 정확히 입력해주세요. 마지막 항목 뒤에는 쉼표를 넣지 마세요.
              </p>
            </div>
            <button
              onClick={generateVideo}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] 
                dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!videoTitle || !productInfo || !introVideo || !outroVideo || !backgroundMusic}
            >
                영상 생성
            </button>
          </div>
        </div>

     
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 
        border-t border-gray-200 dark:border-gray-700 p-4 flex justify-center items-center gap-4">
        <button 
          onClick={handleBack}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
            hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          이전
        </button>
        
       
       
         {/* 영상 내보내기 버튼 */}
         <div className="relative group">
          <button
            onClick={() => {
              setIsPreviewModalOpen(true);
            }}
            // disabled={process.env.NODE_ENV !== 'development'}
            className={`px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
              bg-gradient-to-r from-purple-500 to-indigo-500 
              text-white/90 hover:opacity-100 hover:shadow-lg
              ${process.env.NODE_ENV === 'development' 
                ? 'opacity-100 cursor-pointer' 
                : 'opacity-80 cursor-not-allowed'
              }`}
          >
            유투브로 내보내기
            {/* <LockClosedIcon className="w-4 h-4 animate-pulse" /> */}
              {/* 유투브로 내보내기
            {process.env.NODE_ENV !== 'development' && (
              <span className="ml-1 text-xs px-2 py-0.5 bg-white/20 rounded-full">PRO</span>
            )} */}
          </button>
          {/* {process.env.NODE_ENV !== 'development' && (
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-56 
              bg-gradient-to-r from-purple-600 to-indigo-600 text-white
              text-sm rounded-lg p-3 shadow-xl transform transition-all duration-200
              border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <LockClosedIcon className="w-4 h-4" />
                <span>프리미엄 기능입니다</span>
              </div>
              <p className="text-xs text-white/80 mt-1">
                업그레이드하여 고품질 영상을 제작해보세요
              </p>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
