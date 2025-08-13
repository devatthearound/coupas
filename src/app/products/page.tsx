'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ProductData } from '@/services/coupang/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import { LockClosedIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import JSZip from 'jszip';
import { searchProducts } from '@/services/coupang/searchProducts';
import { getCoupangApiKeys } from '@/services/coupang/keys';
import { VideoPreviewModal } from '../components/VideoPreviewModal';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [commentTemplate, setCommentTemplate] = useState<'template1' | 'custom'>('template1');
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [videoProcessingStep, setVideoProcessingStep] = useState('');
  const [generatedVideoInfo, setGeneratedVideoInfo] = useState<{
    outputPath: string;
    videoTitle: string;
    outputDirectory: string;
  } | null>(null);

  // VideoPreviewModal 관련 상태
  const [customComments, setCustomComments] = useState<string>('');
  const [commentTemplateForModal, setCommentTemplateForModal] = useState<'template1' | 'template2'>('template1');

  // 템플릿 상태 관리
  const [templateStatus, setTemplateStatus] = useState<{
    isComplete: boolean;
    activeTemplate: any | null;
    settings: {
      introVideo: string | null;
      outroVideo: string | null;
      backgroundMusic: string;
      outputDirectory: string;
      imageDisplayDuration: number;
    };
  }>({
    isComplete: false,
    activeTemplate: null,
    settings: {
      introVideo: null,
      outroVideo: null,
      backgroundMusic: '',
      outputDirectory: '',
      imageDisplayDuration: 3
    }
  });

  // 템플릿 목록 상태
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    const sessionKey = searchParams?.get('selectedProducts');
    if (sessionKey) {
      try {
        const products = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        // 중복 상품 제거 (같은 productId가 있다면 첫 번째 것만 유지)
        const uniqueProducts = products.filter((product: any, index: number, self: any[]) => 
          index === self.findIndex((p: any) => p.productId === product.productId)
        );
        setSelectedProducts(uniqueProducts);
        
        // 댓글 자동 생성 (함수 정의 후에 처리)
        if (uniqueProducts.length > 0) {
          // 간단한 댓글 생성 로직을 인라인으로 처리
          const header = "이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.\n\n";
          const productsText = uniqueProducts.map((product: ProductData, index: number) => 
            `🏆 ${index + 1}위 ${product.productName}\n` +
            `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
            `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
            `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
            `\n구매링크: ${product.shortUrl || product.productUrl}\n`
          ).join('\n');
          const footer = '\n#쿠팡 #최저가 #추천상품 #쇼핑';
          setCustomComments(header + productsText + footer);
        }
      } catch (error) {
        console.error('Failed to parse products:', error);
        toast.error('상품 정보를 불러올 수 없습니다');
      }
    }
    
    // 검색 키워드 가져오기
    const savedKeyword = sessionStorage.getItem('search-keyword');
    if (savedKeyword) {
      setSearchKeyword(savedKeyword);
    }
  }, [searchParams, commentTemplateForModal]);

  // 템플릿 변경 시 댓글 재생성
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const header = "이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.\n\n";
      const productsText = selectedProducts.map((product: ProductData, index: number) => 
        `🏆 ${index + 1}위 ${product.productName}\n` +
        `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
        `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
        `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
        `\n구매링크: ${product.shortUrl || product.productUrl}\n`
      ).join('\n');
      const footer = '\n#쿠팡 #최저가 #추천상품 #쇼핑';
      setCustomComments(header + productsText + footer);
    }
  }, [commentTemplateForModal, selectedProducts]);

  // 댓글 자동 생성 함수 (모달용)
  const generateModalComment = useCallback((products: ProductData[], template: 'template1' | 'template2'): string => {
    if (products.length === 0) return '';

    try {
      const header = "이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.\n\n";
      
      const templates = {
        template1: (product: ProductData, index: number) => 
          `🏆 ${index + 1}위 ${product.productName}\n` +
          `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
          `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
          `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
          `\n구매링크: ${product.shortUrl || product.productUrl}\n`,

        template2: (product: ProductData, index: number) =>
          `💫 ${index + 1}위 추천! ${product.productName}\n` +
          `💰 특가: ${product.productPrice.toLocaleString()}원\n` +
          `${product.isRocket ? '🚀 로켓배송으로 빠른배송\n' : ''}` +
          `${product.isFreeShipping ? '무료배송 가능\n' : ''}` +
          `\n상세정보 👉 ${product.shortUrl || product.productUrl}\n`
      };

      const productsText = products.map((product: ProductData, index: number) => 
        templates[template](product, index)
      ).join('\n');

      const footer = '\n#쿠팡 #최저가 #추천상품 #쇼핑';

      return header + productsText + footer;
    } catch (error) {
      console.error('댓글 생성 오류:', error);
      return '';
    }
  }, []);

  // 템플릿 상태 체크 함수
  const checkTemplateStatus = async () => {
    try {
      const response = await fetch('/api/video-settings');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // 템플릿 목록 설정
        setTemplates(data.data);
        
        // 가장 최근 템플릿을 기본으로 사용
        const latestTemplate = data.data[0];
        setSelectedTemplateId(latestTemplate.id);
        
        const settings = {
          introVideo: latestTemplate.introVideo,
          outroVideo: latestTemplate.outroVideo,
          backgroundMusic: latestTemplate.backgroundMusic,
          outputDirectory: latestTemplate.outputDirectory,
          imageDisplayDuration: latestTemplate.imageDisplayDuration || 3
        };
        
        const isComplete = Boolean(
          settings.introVideo && 
          settings.outroVideo && 
          settings.backgroundMusic && 
          settings.outputDirectory
        );
        
        setTemplateStatus({
          isComplete,
          activeTemplate: latestTemplate,
          settings
        });
      } else {
        // 템플릿이 없는 경우
        setTemplates([]);
        setSelectedTemplateId('');
        setTemplateStatus({
          isComplete: false,
          activeTemplate: null,
          settings: {
            introVideo: null,
            outroVideo: null,
            backgroundMusic: '',
            outputDirectory: '',
            imageDisplayDuration: 3
          }
        });
      }
    } catch (error) {
      console.error('템플릿 상태 확인 오류:', error);
    }
  };

  // 템플릿 적용 함수
  const applyTemplate = async (templateId: string) => {
    if (!templateId) return;
    
    try {
      const response = await fetch(`/api/video-settings/${templateId}`);
      const data = await response.json();

      if (data.success) {
        const template = data.data;
        
        const settings = {
          introVideo: template.introVideo,
          outroVideo: template.outroVideo,
          backgroundMusic: template.backgroundMusic,
          outputDirectory: template.outputDirectory,
          imageDisplayDuration: template.imageDisplayDuration || 3
        };
        
        const isComplete = Boolean(
          settings.introVideo && 
          settings.outroVideo && 
          settings.backgroundMusic && 
          settings.outputDirectory
        );
        
        setTemplateStatus({
          isComplete,
          activeTemplate: template,
          settings
        });
        
        setSelectedTemplateId(templateId);
        toast.success(`"${template.name}" 템플릿이 적용되었습니다!`);
      } else {
        toast.error('템플릿을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('템플릿 적용 오류:', error);
      toast.error('템플릿 적용에 실패했습니다.');
    }
  };

  // 페이지 로드 시 템플릿 상태 확인
  useEffect(() => {
    checkTemplateStatus();
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    const newProducts = Array.from(selectedProducts);
    const [removed] = newProducts.splice(sourceIndex, 1);
    newProducts.splice(destinationIndex, 0, removed);

    // 순위 업데이트를 위해 새로운 배열로 상태 업데이트
    setSelectedProducts([...newProducts]);
    
    // sessionStorage도 업데이트
    const sessionKey = searchParams?.get('selectedProducts');
    if (sessionKey) {
      sessionStorage.setItem(sessionKey, JSON.stringify(newProducts));
    }
  };

  const generateComment = (products: ProductData[]): string => {
    const header = "이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.\n\n";
    
    const templates = {
      template1: (product: ProductData, index: number) => 
        `🏆 ${index + 1}위 ${product.productName}\n` +
        `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
        `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
        `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
        `\n구매링크: ${product.shortUrl}\n`,

      custom: (product: ProductData, index: number) =>
        customTemplate
          .replace('{index}', (index + 1).toString())
          .replace('{productName}', product.productName)
          .replace('{productPrice}', product.productPrice.toLocaleString())
          .replace('{shortUrl}', product.shortUrl)
          .replace('{isRocket}', product.isRocket ? '🚀 로켓배송' : '')
          .replace('{isFreeShipping}', product.isFreeShipping ? '무료배송 가능' : '')
    };

    const productsText = products.map((product, index) => 
      templates[commentTemplate === 'custom' ? 'custom' : commentTemplate](product, index)
    ).join('\n');

    return header + productsText;
  };

  const handleDownload = async () => {
    if (!selectedProducts.length) {
      toast.error('검색된 상품이 없습니다.');
      return;
    }

    let successCount = 0;
    const totalCount = selectedProducts.length;
    const zip = new JSZip();

    // 로딩 시작
    toast.loading('다운로드 준비 중...', { id: 'download' });

    try {
      // 댓글 텍스트 파일 추가
      const comments = generateComment(selectedProducts);
      zip.file('순위_댓글.txt', comments);

      // 이미지 다운로드 및 추가
      for (let index = 0; index < selectedProducts.length; index++) {
        const product = selectedProducts[index];
        // 파일명에서 특수문자 제거 및 길이 제한
        const sanitizedName = product.productName
          .replace(/[^a-zA-Z0-9가-힣]/g, '_')
          .slice(0, 30);
        const fileName = `${index + 1}위_${sanitizedName}.jpg`;

        try {
          // 서버 API를 통해 이미지 다운로드
          const response = await fetch(`/api/download-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: product.productImage }),
          });

          if (!response.ok) throw new Error('이미지 다운로드 실패');

          const blob = await response.blob();
          zip.file(`images/${fileName}`, blob);
          successCount++;
        } catch (error) {
          console.error(`Failed to download image for product: ${product.productName}`, error);
        }
      }

      // ZIP 파일 생성
      toast.loading('ZIP 파일 생성 중...', { id: 'download' });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // ZIP 파일 다운로드
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `순위_댓글_이미지_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 로딩 종료 및 결과 표시
      toast.dismiss('download');
      if (successCount === totalCount) {
        toast.success('댓글과 이미지가 ZIP 파일로 다운로드되었습니다!');
      } else {
        toast.success(`댓글과 ${successCount}/${totalCount}개의 이미지가 다운로드되었습니다`);
      }
    } catch (error) {
      console.error('ZIP 파일 생성 실패:', error);
      toast.error('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsPreviewModalOpen(false);
    }
  };

  const handleDelete = (index: number) => {
    const newProducts = [...selectedProducts];
    const deletedProduct = newProducts.splice(index, 1)[0];
    setSelectedProducts(newProducts);
    
    // sessionStorage도 업데이트
    const sessionKey = searchParams?.get('selectedProducts');
    if (sessionKey) {
      sessionStorage.setItem(sessionKey, JSON.stringify(newProducts));
    }
    
    toast.success(`"${deletedProduct.productName.slice(0, 20)}..." 상품이 삭제되었습니다`);
  };

  const handleLoadMoreProducts = async () => {
    if (!searchKeyword.trim()) {
      toast.error('검색 키워드가 없습니다');
      return;
    }

    setIsLoadingMoreProducts(true);

    const keys = await getCoupangApiKeys();
    
    if (!keys) {
      toast.error('API 키가 없습니다. 설정 페이지에서 설정해주세요.');
      setIsLoadingMoreProducts(false);
      return;
    }

    try {
      // 현재 상품 개수를 기준으로 skip하여 다음 5개 가져오기
      const currentCount = selectedProducts.length;
      const products = await searchProducts({
        keyword: searchKeyword,
        limit: currentCount + 5, // 전체 상품을 가져온 후 슬라이스
        accessKey: keys.accessKey,
        secretKey: keys.secretKey,
      });

      // 현재 상품 개수 이후의 5개 상품만 추출
      const newProducts = products.slice(currentCount, currentCount + 5);
      
      if (newProducts.length === 0) {
        toast('더 이상 검색할 상품이 없습니다', { icon: 'ℹ️' });
        return;
      }

      // 중복 상품 제거 (기존 상품과 productId가 같은 것은 제외)
      const existingProductIds = selectedProducts.map(p => p.productId);
      const uniqueNewProducts = newProducts.filter(product => 
        !existingProductIds.includes(product.productId)
      );

      if (uniqueNewProducts.length === 0) {
        toast('중복되지 않은 새로운 상품이 없습니다', { icon: 'ℹ️' });
        return;
      }

      // 기존 상품과 새로운 상품 합치기
      const updatedProducts = [...selectedProducts, ...uniqueNewProducts];
      setSelectedProducts(updatedProducts);
      
      // sessionStorage 업데이트
      const sessionKey = searchParams?.get('selectedProducts');
      if (sessionKey) {
        sessionStorage.setItem(sessionKey, JSON.stringify(updatedProducts));
      }
      
      toast.success(`${uniqueNewProducts.length}개의 새로운 상품이 추가되었습니다!`);

    } catch (error) {
      console.error('추가 검색 실패:', error);
      toast.error('추가 상품 검색에 실패했습니다');
    } finally {
      setIsLoadingMoreProducts(false);
    }
  };

  const handleVideoGeneration = async () => {
    console.log('🎬 === 영상 생성 시작 ===');
    console.log('🔍 검색 키워드:', searchKeyword);
    console.log('📊 선택된 상품 개수:', selectedProducts.length);
    
    if (!searchKeyword.trim()) {
      toast.error('검색 키워드가 없습니다');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('선택된 상품이 없습니다');
      return;
    }

    console.log('📋 현재 선택된 상품 순서:');
    selectedProducts.forEach((product, index) => {
      console.log(`${index + 1}. [${product.rank}위] ${product.productName} - 가격: ${product.productPrice}원`);
    });

    setIsVideoProcessing(true);

    try {
      // 1. 템플릿 설정 확인
      setVideoProcessingStep('템플릿 설정 확인 중...');
      console.log('🔧 템플릿 설정 확인 중...');
      const templateResponse = await fetch('/api/video-settings');
      const templateData = await templateResponse.json();
      
      if (!templateData.success || templateData.data.length === 0) {
        setIsVideoProcessing(false);
        toast.error('영상 템플릿이 설정되지 않았습니다');
        if (confirm('영상 템플릿을 설정하시겠습니까?')) {
          router.push('/settings/video-templates');
        }
        return;
      }

      // 기본 템플릿 사용 (첫 번째 템플릿)
      const template = templateData.data[0];
      
      if (!template.introVideo || !template.outroVideo || !template.backgroundMusic || !template.outputDirectory) {
        setIsVideoProcessing(false);
        toast.error('템플릿 설정이 완전하지 않습니다');
        if (confirm('영상 템플릿을 완성하시겠습니까?')) {
          router.push('/settings/video-templates');
        }
        return;
      }

      // 2. 자동 타이틀 생성
      setVideoProcessingStep('AI 타이틀 생성 중...');
      const titleResponse = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchKeyword }),
      });
      
      let videoTitle = `${searchKeyword} 2025년 가성비 추천 TOP ${selectedProducts.length} | 할인 정보 포함`;
      
      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        if (titleData.success && titleData.title) {
          videoTitle = titleData.title;
        }
      }

      // 3. 영상 생성
      setVideoProcessingStep('영상 생성 중...');
      
      if (!window.electron) {
        toast.error('데스크톱 앱에서만 영상 생성이 가능합니다');
        setIsVideoProcessing(false);
        return;
      }

      // 파일명용: 키워드 + 생성날짜
      const now = new Date();
      const dateString = now.getFullYear().toString() + 
                        (now.getMonth() + 1).toString().padStart(2, '0') + 
                        now.getDate().toString().padStart(2, '0') + 
                        '_' +
                        now.getHours().toString().padStart(2, '0') + 
                        now.getMinutes().toString().padStart(2, '0');
      
      // 키워드에서 특수문자 제거하고 파일명 생성
      const cleanKeyword = searchKeyword.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const videoFileName = `${cleanKeyword}_${dateString}`;
      
      console.log('📁 생성할 영상 파일명:', videoFileName);
      
      console.log('🎬 Electron으로 영상 생성 호출 중...');
      console.log('📝 영상 제목:', searchKeyword);
      console.log('🎞️ 인트로 비디오:', template.introVideo);
      console.log('🎞️ 아웃트로 비디오:', template.outroVideo);
      console.log('🎵 배경음악:', template.backgroundMusic);
      console.log('📂 출력 디렉터리:', template.outputDirectory);
      console.log('⏱️ 이미지 표시 시간:', template.imageDisplayDuration || 3);
      console.log('🛍️ 전달할 상품 개수:', selectedProducts.length);
      
      console.log('🛍️ Electron으로 전달되는 상품 목록:');
      selectedProducts.forEach((product, index) => {
        console.log(`${index + 1}. [${product.rank}위] ${product.productName}`);
        console.log(`   - 이미지: ${product.productImage}`);
        console.log(`   - 가격: ${product.productPrice}원`);
      });

      const videoResult = await window.electron.combineVideosAndImages(
        searchKeyword, // 영상 제목으로 키워드만 사용
        template.introVideo,
        template.outroVideo,
        template.backgroundMusic,
        '', // backgroundTemplatePath
        selectedProducts,
        '', // logoPath
        template.outputDirectory,
        template.imageDisplayDuration || 3,
        videoFileName // 파일명은 별도로 전달
      );

      console.log('✅ 영상 생성 결과:', videoResult);
      
      if (!videoResult.success) {
        throw new Error(videoResult.error || '영상 생성에 실패했습니다');
      }

      console.log('영상 생성 성공! 출력 경로:', videoResult.outputPath);
      
      if (!videoResult.outputPath) {
        throw new Error('생성된 영상 파일 경로가 없습니다');
      }

            // 영상 생성 정보 저장
      setGeneratedVideoInfo({
        outputPath: videoResult.outputPath,
        videoTitle: videoTitle,
        outputDirectory: template.outputDirectory
      });

      toast.success('영상 생성이 완료되었습니다! 업로드 모달을 열어드립니다...');

      // VideoPreviewModal 바로 열기
      setGeneratedVideoInfo({
        outputPath: videoResult.outputPath,
        videoTitle: videoTitle,
        outputDirectory: template.outputDirectory
      });
      setIsPreviewModalOpen(true);

    } catch (error) {
      console.error('영상 생성 오류:', error);
      toast.error(`영상 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsVideoProcessing(false);
      setVideoProcessingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">검색된 상품</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">2/3 단계</div>
        </div>

        {/* 안내 메시지 */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  순서 변경 가능
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  상품을 드래그하여 순서를 변경할 수 있습니다. 순위는 자동으로 업데이트됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
          {selectedProducts.length === 0 ? (
            /* 상품이 없을 때 표시할 메시지 */
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 mb-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                검색된 상품이 없습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                상품 검색 페이지에서 상품을 선택해주세요.
              </p>
              <button
                onClick={() => router.push('/search')}
                className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] transition-colors"
              >
                상품 검색하러 가기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Header */}
              <div 
                className="bg-gray-100 dark:bg-gray-800 grid gap-3 p-4 rounded-t-lg font-medium sticky top-0 z-10"
                style={{
                  gridTemplateColumns: '60px 80px 1fr 120px 80px 80px 60px'
                }}
              >
                <div className="text-center">순위</div>
                <div className="text-center">이미지</div>
                <div>상품명</div>
                <div className="text-right">가격</div>
                <div className="text-center">특징</div>
                <div className="text-center">제휴링크</div>
                <div className="text-center">삭제</div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="droppable">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="flex flex-col"
                      >
                        {selectedProducts.map((product, index) => (
                          <Draggable 
                            key={`${product.productId}-${index}`}
                            draggableId={`${product.productId}-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`grid gap-3 p-4 border-b border-gray-200 
                                  dark:border-gray-600 items-center
                                  ${snapshot.isDragging ? 'bg-gray-50' : 'bg-white'}
                                  dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                  cursor-grab active:cursor-grabbing`}
                                style={{
                                  gridTemplateColumns: '60px 80px 1fr 120px 80px 80px 60px',
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div className="font-bold text-lg text-[#514FE4] text-center">
                                  {index + 1}
                                </div>
                                <div className="flex justify-center">
                                  <div className="w-[50px] h-[50px] relative">
                                    <Image
                                      src={product.productImage}
                                      alt={product.productName}
                                      fill
                                      className="object-contain rounded"
                                    />
                                  </div>
                                </div>
                                <div className="pr-2">
                                  <p className="line-clamp-2 text-sm leading-relaxed">{product.productName}</p>
                                </div>
                                <div className="font-semibold text-right">
                                  {product.productPrice.toLocaleString()}원
                                </div>
                                <div className="flex flex-col gap-1 items-center">
                                  {product.isRocket && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                      로켓
                                    </span>
                                  )}
                                  {product.isFreeShipping && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                      무료배송
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      // Electron 환경인지 확인
                                      if (typeof window !== 'undefined' && window.electron?.openExternal) {
                                        window.electron.openExternal(product.shortUrl);
                                      } else {
                                        // 웹 환경에서는 새 탭으로 열기
                                        window.open(product.shortUrl, '_blank', 'noopener,noreferrer');
                                      }
                                    }}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors border border-blue-200 dark:border-blue-800"
                                    title={`제휴링크 열기: ${product.shortUrl}`}
                                  >
                                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(index);
                                    }}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors border border-red-200 dark:border-red-800"
                                    title="상품 삭제"
                                  >
                                    <svg 
                                      className="w-4 h-4 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      stroke="currentColor"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          )}
        </div>

        {/* 추가로 5개 더 검색 버튼 */}
        {selectedProducts.length > 0 && searchKeyword && (
          <div className="flex justify-center mt-4 mb-6">
            <button
              onClick={handleLoadMoreProducts}
              disabled={isLoadingMoreProducts}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed
                underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all duration-200"
            >
              {isLoadingMoreProducts ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  검색 중...
                </span>
              ) : (
                `추가로 5개 더 검색 "${searchKeyword}"`
              )}
            </button>
          </div>
        )}
      </div>

      {/* 댓글 미리보기 모달 */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">댓글 미리보기</h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[80vh]">
            
              {/* 출력 형식 선택 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  {/* 아이콘 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      아이콘 선택
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setCommentTemplate('template1')}
                        className={`flex flex-col items-center p-3 border rounded-lg transition-colors
                          ${commentTemplate === 'template1' 
                            ? 'border-[#514FE4] bg-[#514FE4]/5' 
                            : 'hover:border-[#514FE4]'
                          }`}
                      >
                        <span className="text-2xl mb-1">🏆</span>
                        <span className="text-xs">기본</span>
                      </button>
                      <button 
                        onClick={() => setCommentTemplate('custom')}
                        className={`flex flex-col items-center p-3 border rounded-lg transition-colors
                          ${commentTemplate === 'custom' 
                            ? 'border-[#514FE4] bg-[#514FE4]/5' 
                            : 'hover:border-[#514FE4]'
                          }`}
                      >
                        <span className="text-2xl mb-1">✏️</span>
                        <span className="text-xs">사용자 정의</span>
                      </button>
                    </div>
                  </div>

                  {/* 사용자 정의 템플릿 입력 */}
                  {commentTemplate === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        사용자 정의 템플릿
                      </label>
                      <textarea 
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg 
                          text-gray-200 placeholder-gray-500"
                        placeholder="템플릿을 입력하세요. 예: {index}위 {productName} - {productPrice}원"
                        rows={4}
                        value={customTemplate}
                        onChange={(e) => setCustomTemplate(e.target.value)}
                      />
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        사용 가능한 변수: 
                        <ul className="list-disc list-inside">
                          <li><code>순위: {'{index}'}</code></li>
                          <li><code>상품명: {'{productName}'}</code></li>
                          <li><code>상품 가격: {'{productPrice}'}</code></li>
                          <li><code>상품 링크: {'{shortUrl}'}</code></li>
                          <li><code>로켓배송 여부: {'{isRocket}'}</code></li>
                          <li><code>무료배송 여부: {'{isFreeShipping}'}</code></li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="p-4">
                <div className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 
                  bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {generateComment(selectedProducts)}
                </div>
              </div>

            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] 
                  dark:hover:bg-[#5B54E8] text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 출력형식 모달 */}
      {isFormatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">출력 형식 설정</h3>
              <button
                onClick={() => setIsFormatModalOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    출력 형식
                  </label>
                  <textarea 
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg 
                      text-gray-200 placeholder-gray-500"
                    placeholder="출력 형식을 입력하세요"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setIsFormatModalOpen(false)}
                className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 
        border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProducts.length}개 상품 {searchKeyword && `• "${searchKeyword}"`}
              {generatedVideoInfo && (
                <span className="ml-3 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  영상 생성 완료
                </span>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => router.back()}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                이전
              </button>
              
              {/* 템플릿 드롭다운 - 눈에 띄지 않게 */}
              {templates.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      if (e.target.value) {
                        applyTemplate(e.target.value);
                      }
                    }}
                    className="text-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                      border border-gray-200 dark:border-gray-600 rounded-md
                      focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    <option value="">템플릿 선택</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 영상 생성 버튼 - 메인 */}
              {!generatedVideoInfo && (
                <button
                  onClick={handleVideoGeneration}
                  disabled={isVideoProcessing || selectedProducts.length === 0}
                  className="px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                    bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600
                    disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                    text-white shadow-lg hover:shadow-xl"
                >
                  {isVideoProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">{videoProcessingStep}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">영상 생성</span>
                    </>
                  )}
                </button>
              )}
              
              {/* 영상 생성 완료 후에만 옵션 표시 */}
              {generatedVideoInfo && (
                /* 영상 생성 완료 후 버튼들 */
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      await window.electron.openFolder(generatedVideoInfo.outputDirectory);
                    }}
                    className="px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                      bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                      hover:bg-gray-200 dark:hover:bg-gray-600 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    폴더 열기
                  </button>
                  
                  <button
                    onClick={() => {
                      // 상품 정보를 세션에 저장
                      sessionStorage.setItem('coupang-selected-products', JSON.stringify(selectedProducts));
                      console.log('유튜브 업로드 페이지로 이동 - 상품 정보 저장:', selectedProducts);
                      
                      // 유튜브 업로드 페이지로 이동 (영상 경로 전달)
                      const videoPath = encodeURIComponent(generatedVideoInfo.outputPath);
                      router.push(`/youtube?videoPath=${videoPath}`);
                    }}
                    className="px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                      bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    유튜브 업로드
                  </button>
                  
                  <button
                                         onClick={() => {
                       setGeneratedVideoInfo(null);
                       toast('새로운 영상을 생성할 수 있습니다', { icon: 'ℹ️' });
                     }}
                    className="px-4 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                      text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    새로 생성
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VideoPreviewModal */}
      {generatedVideoInfo && (
        <VideoPreviewModal
          videoTitle={generatedVideoInfo.videoTitle}
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          videoUrl={generatedVideoInfo.outputPath}
          onYoutubeUpload={async (uploadData) => {
            console.log('업로드 완료:', uploadData);
            setIsPreviewModalOpen(false);
            toast.success('영상이 성공적으로 업로드되었습니다!');
          }}
          comments={customComments}
          commentTemplate={commentTemplateForModal}
          onCommentTemplateChange={setCommentTemplateForModal}
          onCommentsChange={setCustomComments}
          keyword={searchKeyword}
        />
      )}
    </div>
  );
} 