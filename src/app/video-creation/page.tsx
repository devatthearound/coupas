'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProductData } from '@/services/coupang/types';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import { isElectron } from '@/utils/environment';
import ProductEditor from '../components/ProductEditor';
// 기존 import 문에 추가
import TemplateModal from '../components/TemplateModal';
import { VideoTemplate, templateService } from '@/services/templates/api';
import { useUser } from '../contexts/UserContext';

export default function VideoCreationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoCreationContent />
    </Suspense>
  );
}

type ExtendedProductData = ProductData & {
  rating: number;
  ratingCount: number;
  features: string;
  isFreeShipping: boolean;
  discountRate: number;
}

function VideoCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState<ExtendedProductData[]>([]);
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

  // 로고 이미지 상태 추가
  const [logoPath, setLogoPath] = useState<string>('');

  // 이미지 표시 시간 상태 추가
  const [imageDisplayDuration, setImageDisplayDuration] = useState<number>(3);

  // 저장 경로 상태 추가
  const [outputDirectory, setOutputDirectory] = useState<string>('');

  const skinOptions = [
    { label: '기본 스킨', value: 'default', description: '깔끔한 기본 디자인' },
    // { label: '모던 스킨', value: 'modern', description: '세련된 모던 디자인' },
    // { label: '미니멀 스킨', value: 'minimal', description: '심플한 미니멀 디자인' },
    // { label: '다이나믹 스킨', value: 'dynamic', description: '화려한 모션 디자인' },
  ];

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
const { user } = useUser();

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
      
      console.log('response', response);
      if (!response.ok) {
        toast.error('유튜브 로그인이 필요합니다.');
        setIsAuthenticating(true);
        setPendingUploadData(uploadData);
        const electronPath = encodeURIComponent(`coupas-auth://google-auth/success`);
        const redirectUrl = `https://growsome.kr/google-auth?redirect_to=${electronPath}`;
  
        window.electron.openExternal(redirectUrl);
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
        const videoId = result.links.studioEditLink;
        setUploadProgress(100);
        setUploadStatus('업로드 완료!');
        toast.success(
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>유튜브 업로드가 완료되었습니다</span>
            <button
              onClick={() => window.electron.openExternal(videoId)}
              className="text-[#514FE4] hover:text-[#4140B3] dark:text-[#6C63FF] dark:hover:text-[#5B54E8] font-medium"
            >
              바로가기
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

  // 저장 경로 선택 핸들러 추가
  const handleSelectOutputDirectory = async () => {
    try {
      const directoryPath = await window.electron.selectDirectory();
      if (directoryPath) {
        setOutputDirectory(directoryPath);
      }
    } catch (error) {
      console.error('저장 경로 선택 중 오류:', error);
    }
  };

  const generateVideo = async () => {
    if(!videoTitle) {
      toast.error('키워드를 입력해주세요.');
      return;
    }
    if(selectedProducts.length === 0) {
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
    if(!outputDirectory) {
      toast.error('저장 경로를 선택해주세요.');
      return;
    }

    
    try {
      setIsProcessing(true);
      setProgress('비디오와 이미지를 합치는 중...');
      
      // 파일 경로 로그에 로고 추가
      console.log('비디오 생성 시작: ', {
        videoTitle,
        introVideo,
        outroVideo,
        backgroundMusic,
        backgroundTemplatePath,
        logoPath
      });
      
      const result = await window.electron.combineVideosAndImages(
        videoTitle,
        introVideo,
        outroVideo,
        backgroundMusic,
        backgroundTemplatePath,
        selectedProducts.reverse(),
        logoPath,
        outputDirectory,
        imageDisplayDuration
      );

      console.log('비디오 합성 결과:', result);

      if (result.success) {
        setProgress('');
        // 생성된 비디오 경로 저장
        if(result.outputPath) {
          setGeneratedVideoUrl(result.outputPath);
        }
        toast.success('비디오 합성이 완료되었습니다!');
        
        // 폴더 열기 확인 팝업
        if (confirm('영상 생성이 완료되었습니다. 해당 폴더를 여시겠습니까?')) {
          await window.electron.openFolder(outputDirectory);
        }
        setIsPreviewModalOpen(true);
      } else {
        setProgress('');
        toast.error(`합성 실패: ${result.error}`);
      }
    } catch (error) {
      setProgress('');
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
    if (selectedProducts.length === 0) return '';

    try {
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

      const productsText = selectedProducts.map((product: any, index: number) => 
        templates[commentTemplate](product, index)
      ).join('\n');

      const footer = '\n#쿠팡 #최저가 #추천상품 #쇼핑';

      return header + productsText + footer;
    } catch (error) {
      return '';
    }
  }, [selectedProducts, commentTemplate]);

  // URL 파라미터에서 상품 정보 가져오기
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const productsParam = searchParams.get('products');
    const searchQuery = sessionStorage.getItem('searchQuery');
    if (productsParam) {
      try {
        const decodedProducts = JSON.parse(decodeURIComponent(productsParam));
        setSelectedProducts(decodedProducts);
        setVideoTitle(searchQuery || '');
      } catch (error) {
        toast.error('상품 정보를 불러오는데 실패했습니다.');
      }
    }
  }, []);

  const applyTemplate = (template: VideoTemplate) => {
    // 입력 필드 값 설정
    if (template.intro_video_path) {
      setIntroVideo(template.intro_video_path);
    }
    
    if (template.outro_video_path) {
      setOutroVideo(template.outro_video_path);
    }
    
    if (template.background_music_path) {
      setBackgroundMusic(template.background_music_path);
    }
    
    if (template.output_directory) {
      setOutputDirectory(template.output_directory);
    }
    
    if (template.image_display_duration) {
      setImageDisplayDuration(template.image_display_duration);
    }
    
    toast.success(`'${template.template_name}' 템플릿이 적용되었습니다.`);
  };
  
  /**
   * 현재 설정을 템플릿으로 저장
   */
  const saveCurrentTemplate = async (templateName: string, isDefault: boolean) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    try {
      const template: Partial<VideoTemplate> = {
        user_id: parseInt(user.id),
        template_name: templateName,
        intro_video_path: introVideo || undefined,
        outro_video_path: outroVideo || undefined,
        background_music_path: backgroundMusic || undefined,
        output_directory: outputDirectory || undefined,
        image_display_duration: imageDisplayDuration,
        is_default: isDefault,
        is_active: true
      };
      
      await templateService.createTemplate(template);
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      toast.error('템플릿 저장 중 오류가 발생했습니다.');
      throw error;
    }
  };
  
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      try {
        const template = await templateService.getDefaultTemplate();
        if (template) {
          applyTemplate(template);
        }
      } catch (error) {
        console.error('기본 템플릿 로드 오류:', error);
      }
    }
    
    loadDefaultTemplate();
  }, []);


  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
      <VideoPreviewModal
        videoTitle={videoTitle}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        videoUrl={generatedVideoUrl || ''}
        onYoutubeUpload={uploadToYoutube}
        comments={customComments || generateComment()}  
        commentTemplate={commentTemplate}
        onCommentTemplateChange={(template) => {
          setCommentTemplate(template);
          setCustomComments(generateComment());
        }}
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
  
  {/* <div className="max-w-7xl mx-auto px-4 py-12 w-full h-full overflow-auto"> */}
  {/* 헤더 부분 개선 - 제목과 템플릿 버튼을 함께 배치 */}
        <div className="max-w-7xl mx-auto px-4 py-12 w-full  h-full overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              영상 만들기
            </h1>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2 bg-[#514FE4]/10 text-[#514FE4] dark:bg-[#6C63FF]/10 dark:text-[#6C63FF] 
                hover:bg-[#514FE4]/20 dark:hover:bg-[#6C63FF]/20 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" 
                />
              </svg>
              템플릿 관리
            </button>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            3/3 단계
          </div>
        </div>

        
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                키워드
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
                placeholder="키워드를 입력하세요"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                인트로 영상
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
                아웃트로 영상
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
                배경 음악
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
  
            {/* 이미지 표시 시간 설정 추가 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상품 이미지 표시 시간 (초)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={imageDisplayDuration}
                  onChange={(e) => setImageDisplayDuration(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 min-w-[3ch]">
                  {imageDisplayDuration}초
                </span>
              </div>
            </div>
  
            {/* 저장 경로 선택 버튼 추가 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                저장 경로
              </label>
              <button
                onClick={handleSelectOutputDirectory}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 rounded text-left transition-colors"
              >
                <span className="inline-block mr-4 py-2 px-4
                  rounded-full border-0
                  text-sm font-semibold
                  bg-[#514FE4]/10 text-[#514FE4]
                  dark:bg-[#6C63FF]/10 dark:text-[#6C63FF]
                  hover:bg-[#514FE4]/20">
                  폴더 선택
                </span>
                {outputDirectory ? outputDirectory : '선택된 폴더 없음'}
              </button>
            </div>
  
            {/* 상품 정보 수정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상품 정보 수정
              </label>
              <div className="space-y-4">
                {selectedProducts.map((product, index) => (
                  <ProductEditor
                    key={product.productId}
                    products={product}
                    onChange={(updatedProduct) => {
                      const newProducts = [...selectedProducts];
                      newProducts[index] = updatedProduct;
                      setSelectedProducts(newProducts);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
            {/* Bottom Navigation */}
            <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 
        border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProducts.length}개 선택됨
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                이전
              </button>
              
              {/* 다운로드 버튼 */}
              <div className="relative group">
                <button
                  onClick={generateVideo}
                  disabled={selectedProducts.length === 0}
                  className={`px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2
                    ${selectedProducts.length > 0
                      ? 'bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                >
                  영상 생성
                </button>
              </div>

              {/* 영상 내보내기 버튼 */}
              {/* <div className="relative group">
                <button
                  disabled={!generatedVideoUrl}
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                    bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80
                    text-white/90 hover:opacity-100 hover:shadow-lg"
                >
                  Youtube 업로드
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        currentSettings={{
          templateName: videoTitle, // 현재 비디오 제목을 기본 템플릿 이름으로 사용
          introVideo,
          outroVideo,
          backgroundMusic,
          outputDirectory,
          imageDisplayDuration
        }}
        onLoadTemplate={applyTemplate}
        onSaveTemplate={saveCurrentTemplate}
      />
    </div>
  );
}
