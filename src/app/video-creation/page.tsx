'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProductData } from '@/services/coupang/types';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import { isElectron } from '@/utils/environment';
import Image from 'next/image';
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
  const { user } = useUser();
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

  // 템플릿 관련 상태
  const [templates, setTemplates] = useState<Array<{
    id: string;
    name: string;
    introVideo: string | null;
    outroVideo: string | null;
    backgroundMusic: string;
    imageDisplayDuration: number;
    outputDirectory: string;
    createdAt: string;
  }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const skinOptions = [
    { label: '기본 스킨', value: 'default', description: '깔끔한 기본 디자인' },
    // { label: '모던 스킨', value: 'modern', description: '세련된 모던 디자인' },
    // { label: '미니멀 스킨', value: 'minimal', description: '심플한 미니멀 디자인' },
    // { label: '다이나믹 스킨', value: 'dynamic', description: '화려한 모션 디자인' },
  ];

  // 템플릿 관련 함수들
  // API 기반 템플릿 저장/로드 함수들
  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/video-settings');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        console.error('템플릿 로드 실패:', data.error);
        toast.error('템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 로드 중 오류:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    }
  }, []);

  const saveTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      toast.error('템플릿 이름을 입력해주세요.');
      return;
    }

    if (!introVideo || !outroVideo || !backgroundMusic || !outputDirectory) {
      toast.error('모든 설정을 완료해주세요.');
      return;
    }

    try {
      const templateData = {
        name: templateName.trim(),
        introVideo,
        outroVideo,
        backgroundMusic,
        imageDisplayDuration,
        outputDirectory
      };

      const response = await fetch('/api/video-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates(); // 템플릿 목록 새로고침
        setTemplateName('');
        setIsTemplateModalOpen(false);
        toast.success('템플릿이 저장되었습니다!');
      } else {
        toast.error(data.error || '템플릿 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      toast.error('템플릿 저장에 실패했습니다.');
    }
  }, [templateName, introVideo, outroVideo, backgroundMusic, imageDisplayDuration, outputDirectory, loadTemplates]);

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/video-settings/${templateId}`);
      const data = await response.json();

      if (data.success) {
        const template = data.data;
        setIntroVideo(template.introVideo);
        setOutroVideo(template.outroVideo);
        setBackgroundMusic(template.backgroundMusic);
        setImageDisplayDuration(template.imageDisplayDuration);
        setOutputDirectory(template.outputDirectory);
        setSelectedTemplate(templateId);
        toast.success(`"${template.name}" 템플릿이 적용되었습니다!`);
      } else {
        toast.error(data.error || '템플릿을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      toast.error('템플릿 적용에 실패했습니다.');
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/video-settings/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates(); // 템플릿 목록 새로고침
        
        if (selectedTemplate === templateId) {
          setSelectedTemplate('');
        }
        
        toast.success('템플릿이 삭제되었습니다.');
      } else {
        toast.error(data.error || '템플릿 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      toast.error('템플릿 삭제에 실패했습니다.');
    }
  }, [templates, selectedTemplate, loadTemplates]);

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



    // 인증 상태를 주기적으로 확인하는 폴링
    let authCheckInterval: NodeJS.Timeout | null = null;
    
    if (isAuthenticating && pendingUploadData) {
      authCheckInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/google-auth/token');
          if (response.ok) {
            console.log('인증이 완료되었습니다. 업로드를 재시도합니다.');
            setIsAuthenticating(false);
            uploadToYoutube(pendingUploadData);
            setPendingUploadData(null);
            if (authCheckInterval) {
              clearInterval(authCheckInterval);
            }
          }
        } catch (error) {
          console.log('인증 상태 확인 중 오류:', error);
        }
      }, 2000); // 2초마다 확인
    }

    return () => {
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
    };
  }, [pendingUploadData, isAuthenticating]);

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
        // 임시로 로컬 구글 인증 사용 (growsome.kr 엔드포인트 준비 전까지)
        if (window.electron) {
          window.electron.openExternal(`${window.location.origin}/google-auth`);
        } else {
          router.push('/google-auth');
        }
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
        
        // 완료 페이지로 이동
        const productsParam = encodeURIComponent(JSON.stringify(selectedProducts));
        let url = `/video-complete?videoTitle=${encodeURIComponent(videoTitle)}&videoPath=${encodeURIComponent(result.outputPath)}&outputDirectory=${encodeURIComponent(outputDirectory)}`;
        
        if (selectedProducts.length > 0) {
          url += `&products=${productsParam}`;
        }
        
        console.log('완료 페이지로 이동:', url);
        router.push(url);
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
          `🏆 ${index + 1}위 ${product.productName}\n` +
          `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
          `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
          `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
          `\n구매링크: ${product.shortUrl}\n`,

        template2: (product: any, index: number) =>
          `💫 ${index + 1}위 추천! ${product.productName}\n` +
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

  // 컴포넌트 마운트 시 템플릿 로드
  useEffect(() => {
    loadTemplates();
  }, []);

  // URL 파라미터에서 상품 정보 가져오기
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const productsParam = searchParams.get('products');
    const searchQuery = sessionStorage.getItem('searchQuery');
    if (productsParam) {
      console.log('productsParam', productsParam);
      try {
        const decodedProducts = JSON.parse(decodeURIComponent(productsParam));
        // 중복 상품 제거 (같은 productId가 있다면 첫 번째 것만 유지)
        const uniqueProducts = decodedProducts.filter((product: any, index: number, self: any[]) => 
          index === self.findIndex((p: any) => p.productId === product.productId)
        );
        setSelectedProducts(uniqueProducts);
      } catch (error) {
        toast.error('상품 정보를 불러오는데 실패했습니다.');
      }
    }
  }, []);

  // 키워드 가져오기 (URL 파라미터 또는 세션 스토리지에서)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlKeyword = searchParams.get('keyword');
    
    if (urlKeyword) {
      // URL 파라미터에서 키워드가 있으면 우선 사용
      const decodedKeyword = decodeURIComponent(urlKeyword);
      setVideoTitle(decodedKeyword);
      console.log('URL에서 키워드를 가져왔습니다:', decodedKeyword);
    } else {
      // URL 파라미터에 없으면 세션 스토리지에서 가져오기
      const savedKeyword = sessionStorage.getItem('search-keyword');
      if (savedKeyword) {
        setVideoTitle(savedKeyword);
        console.log('세션 스토리지에서 키워드를 가져왔습니다:', savedKeyword);
      }
    }
  }, []);

  // 상품 정보가 변경될 때 JSON 문자열 업데이트
  const handleProductsChange =  (updatedProducts: ExtendedProductData[]) => {
    setSelectedProducts(updatedProducts);
  };
  
  /**
   * 현재 설정을 템플릿으로 저장
   */
  const saveCurrentTemplate = async (templateName: string, isDefault: boolean) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    // TODO: 템플릿 저장 기능 구현
    console.log('템플릿 저장 기능은 아직 구현되지 않았습니다.');
    toast.error('템플릿 저장 기능은 아직 구현되지 않았습니다.');
  };
  
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      // TODO: 기본 템플릿 로드 기능 구현
      console.log('기본 템플릿 로드 기능은 아직 구현되지 않았습니다.');
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
        keyword={videoTitle}
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
            {/* 템플릿 관리 섹션 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200">
                        🎬 영상 설정 템플릿
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        인트로, 아웃트로, 배경음악, 저장경로를 템플릿으로 저장하세요
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    나의 설정 저장
                  </button>
                </div>
                
                {templates.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => e.target.value ? loadTemplate(e.target.value) : setSelectedTemplate('')}
                      className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                        border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:outline-none
                        focus:border-blue-500 dark:focus:border-blue-400"
                    >
                      <option value="">템플릿 선택</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <button
                        onClick={() => deleteTemplate(selectedTemplate)}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 현재 설정을 템플릿으로 저장하여 다음에 빠르게 불러올 수 있습니다.
                  </p>
                )}
                
                {selectedTemplate && (
                  <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    ✓ 『{templates.find(t => t.id === selectedTemplate)?.name}』 템플릿 적용됨
                  </div>
                )}
              </div>
            </div>

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

            {/* 검색된 상품 순서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                검색된 상품 순서
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-2">
                  {selectedProducts.map((product, index) => (
                    <div 
                      key={`product-${product.productId}-${index}`}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="w-8 h-8 bg-[#514FE4] text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 relative overflow-hidden rounded">
                        <img 
                          src={product.productImage} 
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.productName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.productPrice.toLocaleString()}원
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {product.isRocket && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">로켓</span>
                        )}
                        {product.isFreeShipping && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">무료배송</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                  총 {selectedProducts.length}개 상품이 선택되었습니다
                </div>
              </div>
            </div>

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
        
        {/* 영상생성 버튼 */}
        <button
          onClick={generateVideo}
          className="px-6 py-2.5 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] 
            dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] transition-colors font-medium
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!videoTitle || selectedProducts.length === 0 || !introVideo || !outroVideo || !backgroundMusic || !outputDirectory || isProcessing}
        >
          영상생성
        </button>

        {/* 유튜브로 내보내기 버튼 - 영상이 생성된 후에만 표시 */}
        {generatedVideoUrl && (
          <div className="relative group">
            <button
              onClick={() => {
                setIsPreviewModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                bg-gradient-to-r from-purple-500 to-indigo-500 
                text-white hover:opacity-100 hover:shadow-lg"
            >
              유튜브로 내보내기
            </button>
          </div>
        )}
      </div>

      {/* 템플릿 저장 모달 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                템플릿 저장
              </h3>
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setTemplateName('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveTemplate();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="템플릿 이름을 입력하세요"
                  autoFocus
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">저장될 설정:</p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• 인트로 영상: {introVideo ? '설정됨' : '미설정'}</li>
                  <li>• 아웃트로 영상: {outroVideo ? '설정됨' : '미설정'}</li>
                  <li>• 배경 음악: {backgroundMusic ? '설정됨' : '미설정'}</li>
                  <li>• 이미지 표시 시간: {imageDisplayDuration}초</li>
                  <li>• 저장 경로: {outputDirectory ? '설정됨' : '미설정'}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setTemplateName('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
