'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProductData } from '@/services/coupang/types';
import { isElectron } from '@/utils/environment';
import Image from 'next/image';

export default function VideoUploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoUploadContent />
    </Suspense>
  );
}

function VideoUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoTags, setVideoTags] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [thumbnailPath, setThumbnailPath] = useState('./thumb_img.png');

  // URL 파라미터에서 데이터 가져오기
  useEffect(() => {
    const productsParam = searchParams?.get('products');
    const generatedVideo = searchParams?.get('generatedVideo');
    const urlVideoTitle = searchParams?.get('videoTitle');
    const urlKeyword = searchParams?.get('keyword');

    let decodedProducts: ProductData[] = [];

    if (productsParam) {
      try {
        // URL 파라미터를 안전하게 디코딩
        const safeDecode = (str: string) => {
          try {
            return decodeURIComponent(str);
          } catch (error) {
            console.warn('URL 디코딩 실패, 원본 문자열 사용:', str);
            return str;
          }
        };
        
        const decodedParam = safeDecode(productsParam);
        decodedProducts = JSON.parse(decodedParam);
        setSelectedProducts(decodedProducts);
      } catch (error) {
        console.error('상품 파라미터 파싱 실패:', error);
        toast.error('상품 정보를 불러오는데 실패했습니다.');
      }
    }

    if (urlVideoTitle) {
      try {
        setVideoTitle(decodeURIComponent(urlVideoTitle));
      } catch (error) {
        console.warn('비디오 제목 디코딩 실패:', error);
        setVideoTitle(urlVideoTitle);
      }
    }

    if (urlKeyword) {
      try {
        setSearchKeyword(decodeURIComponent(urlKeyword));
      } catch (error) {
        console.warn('키워드 디코딩 실패:', error);
        setSearchKeyword(urlKeyword);
      }
    }

    if (generatedVideo) {
      const decodedVideoPath = decodeURIComponent(generatedVideo);
      
      // electron 환경에서는 file:// 프로토콜 먼저 시도 (webSecurity: false 설정으로 가능)
      if (window.electron) {
        // 파일 경로 정규화 (Windows와 macOS 호환)
        const normalizedPath = decodedVideoPath.replace(/\\/g, '/');
        let fileUrl = normalizedPath;
        
        // file:// 프로토콜이 없으면 추가
        if (!normalizedPath.startsWith('file://') && !normalizedPath.startsWith('http')) {
          fileUrl = `file://${normalizedPath}`;
        }
        
        console.log('파일 URL로 비디오 로드 시도:', fileUrl);
        setGeneratedVideoUrl(fileUrl);
      } else {
        setGeneratedVideoUrl(decodedVideoPath);
      }
    }

    // 자동으로 설명과 태그 생성
    if (urlKeyword && decodedProducts.length > 0) {
      generateDescription(decodedProducts, urlKeyword);
      generateTags(decodedProducts, urlKeyword);
    }
  }, [searchParams]);

  // 설명 자동 생성 (레퍼럴 링크 포함)
  const generateDescription = async (products: ProductData[], keyword: string) => {
    try {
      // 쿠팡 API 키 가져오기
      const userId = localStorage.getItem('userId') || '7';
      const apiKeysResponse = await fetch('/api/coupang/keys', {
        headers: {
          'x-user-id': userId
        }
      });
      
      const apiKeysData = await apiKeysResponse.json();
      
      if (!apiKeysData.data?.accessKey || !apiKeysData.data?.secretKey) {
        console.warn('쿠팡 API 키가 설정되지 않았습니다');
        // API 키가 없어도 기본 설명은 생성
        const productList = products.map((product, index) => 
          `${index + 1}. ${product.productName}\n   가격: ${product.productPrice.toLocaleString()}원\n   링크: ${product.productUrl}`
        ).join('\n\n');

        const description = `${keyword} 관련 상품 추천 영상입니다.

${productList}

✅ 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.

#${keyword.replace(/\s+/g, '')} #상품추천 #쇼핑`;
        setVideoDescription(description);
        return;
      }

      // 레퍼럴 링크 생성
      const coupangUrls = products.map(product => product.productUrl);
      const deeplinkResponse = await fetch('/api/deeplink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Coupang-Access-Key': apiKeysData.data.accessKey,
          'X-Coupang-Secret-Key': apiKeysData.data.secretKey
        },
        body: JSON.stringify({ coupangUrls })
      });
      
      console.log('딥링크 API 응답 상태:', deeplinkResponse.status);

      let productList = '';
      
      if (deeplinkResponse.ok) {
        const deeplinkData = await deeplinkResponse.json();
        console.log('딥링크 API 응답 데이터:', deeplinkData);
        
        // 레퍼럴 링크가 있는 경우
        if (deeplinkData.data && Array.isArray(deeplinkData.data)) {
          productList = products.map((product, index) => {
            const deeplink = deeplinkData.data[index];
            console.log(`상품 ${index + 1} 딥링크:`, deeplink);
            
            // 단축 URL이 있으면 사용 (쿠팡 API는 shortenUrl 반환)
            let referralUrl = '';
            
            if (deeplink?.shortenUrl) {
              // 단축 URL이 있으면 사용
              referralUrl = deeplink.shortenUrl;
              console.log(`단축 URL 사용:`, referralUrl);
            } else {
              // 단축 URL이 없으면 원본 URL 사용 (하지만 suffix 제거)
              referralUrl = product.productUrl;
              console.log(`원본 URL 사용:`, referralUrl);
            }
            
            // |MIXED, |CGV, |CMIXED 등의 suffix 제거 (파이프 문자 이후 모든 것 제거)
            if (referralUrl && referralUrl.includes('|')) {
              const cleanUrl = referralUrl.split('|')[0];
              console.log(`Suffix 제거: ${referralUrl} -> ${cleanUrl}`);
              referralUrl = cleanUrl;
            }
            
            // URL이 유효한지 확인
            if (referralUrl && referralUrl.startsWith('http')) {
              return `${index + 1}. ${product.productName}\n   가격: ${product.productPrice.toLocaleString()}원\n   🔗 구매링크: ${referralUrl}`;
            } else {
              // URL이 유효하지 않으면 원본 URL 사용 (하지만 suffix 제거)
              const cleanOriginalUrl = product.productUrl.split('|')[0];
              return `${index + 1}. ${product.productName}\n   가격: ${product.productPrice.toLocaleString()}원\n   링크: ${cleanOriginalUrl}`;
            }
          }).join('\n\n');
        } else {
          // 레퍼럴 링크 생성 실패 시 원본 URL 사용
          productList = products.map((product, index) => 
            `${index + 1}. ${product.productName}\n   가격: ${product.productPrice.toLocaleString()}원\n   링크: ${product.productUrl}`
          ).join('\n\n');
        }
      } else {
        // API 호출 실패 시 원본 URL 사용
        productList = products.map((product, index) => 
          `${index + 1}. ${product.productName}\n   가격: ${product.productPrice.toLocaleString()}원\n   링크: ${product.productUrl}`
        ).join('\n\n');
      }

      const description = `${keyword} 관련 상품 추천 영상입니다.

${productList}

✅ 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.

#${keyword.replace(/\s+/g, '')} #상품추천 #쇼핑 #쿠팡`;

      setVideoDescription(description);
      toast.success('레퍼럴 링크가 포함된 설명이 생성되었습니다!');
      
    } catch (error) {
      console.error('설명 생성 중 오류:', error);
      // 오류 발생 시에도 기본 설명은 생성
      const productList = products.map((product, index) => 
        `${index + 1}. ${product.productName}\n   가격: ${product.productPrice.toLocaleString()}원\n   링크: ${product.productUrl}`
      ).join('\n\n');

      const description = `${keyword} 관련 상품 추천 영상입니다.

${productList}

구매 링크는 영상 설명란을 확인해주세요!

#${keyword.replace(/\s+/g, '')} #상품추천 #쇼핑`;
      setVideoDescription(description);
    }
  };

  // 태그 자동 생성
  const generateTags = (products: ProductData[], keyword: string) => {
    const tags = [
      keyword,
      '상품추천',
      '쇼핑',
      '리뷰',
      products[0]?.productName?.split(' ')[0] || ''
    ].filter(Boolean).join(', ');
    
    setVideoTags(tags);
  };

  // AI 제목 생성
  const generateTitle = useCallback(async () => {
    if (!searchKeyword) {
      toast.error('키워드가 없습니다.');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: searchKeyword }),
      });

      if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다.');
      }

      const data = await response.json();
      
      if (data.success) {
        setVideoTitle(data.title);
        toast.success('AI 제목이 생성되었습니다!');
      } else {
        toast.error(data.error || '제목 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('제목 생성 오류:', error);
      toast.error('제목 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [searchKeyword]);

  // 유튜브 업로드
  const handleYoutubeUpload = useCallback(async () => {
    if (!generatedVideoUrl || !videoTitle.trim()) {
      toast.error('영상과 제목이 필요합니다.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('업로드 준비 중...');
    setUploadProgress(0);

         try {
       // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

                    // 인증 토큰 가져오기
       const authResponse = await fetch('/api/google-auth/token');
       if (!authResponse.ok) {
         toast.error('유튜브 로그인이 필요합니다.');
         if (window.electron) {
           window.electron.openExternal(`${window.location.origin}/google-auth`);
         } else {
           window.open(`${window.location.origin}/google-auth`, '_blank');
         }
         return;
       }

             const authData = await authResponse.json();
      console.log('🔑 인증 데이터 확인:', authData);

      // 토큰 형식 변환 (API 응답을 Electron이 기대하는 형식으로)
      const authForElectron = {
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiryDate: authData.expires_at,
        tokenType: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
      
      console.log('🔄 변환된 인증 객체:', authForElectron);

      // Electron을 통한 업로드
      const uploadResult = await window.electron.uploadVideo(
        authForElectron,
        videoTitle,
        videoDescription,
        videoTags.split(',').map(tag => tag.trim()).filter(Boolean),
        generatedVideoUrl.replace('file://', ''),
        thumbnailPath
      );

              clearInterval(progressInterval);
             setUploadProgress(100);
      console.log('🎯 업로드 결과 상세:', uploadResult);
      
      if (uploadResult.success) {
        setUploadStatus('업로드 완료!');
        console.log('✅ 유튜브 업로드 성공!');
        
        if ((uploadResult as any).data?.videoData?.id) {
          toast.success(`유튜브 업로드가 완료되었습니다! 비디오 ID: ${(uploadResult as any).data.videoData.id}`);
        } else {
          toast.success('유튜브 업로드가 완료되었습니다!');
        }
        
        // 업로드 완료 후 완료 페이지로 이동
        const productsParam = encodeURIComponent(JSON.stringify(selectedProducts));
        let url = `/video-complete?videoTitle=${encodeURIComponent(videoTitle)}&videoPath=${encodeURIComponent(generatedVideoUrl)}&keyword=${encodeURIComponent(searchKeyword)}`;
        
        if (selectedProducts.length > 0) {
          url += `&products=${productsParam}`;
        }
        
        setTimeout(() => {
          router.push(url);
        }, 2000);
      } else {
        console.error('❌ 업로드 실패:', uploadResult.error);
        
        if (uploadResult.error?.includes('Invalid Credentials') || uploadResult.error?.includes('인증')) {
          toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
          if (window.electron) {
            window.electron.openExternal(`${window.location.origin}/google-auth`);
          } else {
            window.open(`${window.location.origin}/google-auth`, '_blank');
          }
          return;
        }
        throw new Error(uploadResult.error || '업로드 실패');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
      setUploadProgress(0);
    }
  }, [generatedVideoUrl, videoTitle, videoDescription, videoTags, router]);

  if (!generatedVideoUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg max-w-md w-full mx-4 p-6">
          <div className="text-center">
            <div className="w-16 h-16 mb-4 text-gray-400 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">영상이 없습니다</h3>
            <p className="text-gray-400 mb-4">먼저 영상을 생성해주세요.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] transition-colors"
            >
              이전으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">유튜브 업로드</h3>
          <button 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Video Preview */}
        <div className="aspect-video bg-black">
          {isLoadingVideo ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>영상 파일을 불러오는 중...</p>
                <p className="text-sm text-gray-300 mt-2">큰 파일의 경우 시간이 걸릴 수 있습니다</p>
              </div>
            </div>
          ) : generatedVideoUrl ? (
            <video 
              src={generatedVideoUrl} 
              controls 
              className="w-full h-full"
              onLoadStart={() => console.log('비디오 로드 시작:', generatedVideoUrl)}
              onError={async (e) => {
                console.error('비디오 로드 오류:', e);
                console.error('비디오 경로:', generatedVideoUrl);
                
                // file:// 프로토콜이 실패한 경우 data URL로 재시도
                if (window.electron && generatedVideoUrl?.startsWith('file://')) {
                  console.log('file:// 프로토콜 실패, data URL로 재시도');
                  setIsLoadingVideo(true);
                  
                  try {
                    const originalPath = generatedVideoUrl.replace('file://', '');
                    console.log('Data URL로 비디오 로드 재시도:', originalPath);
                    const dataUrl = await window.electron.readFileAsDataUrl(originalPath);
                    setGeneratedVideoUrl(dataUrl);
                    console.log('Data URL로 비디오 로드 성공');
                    toast.success('영상을 다른 방법으로 로드했습니다');
                  } catch (error) {
                    console.error('Data URL 로드도 실패:', error);
                    toast.error('영상 파일을 불러올 수 없습니다. 파일이 존재하는지 확인해주세요.');
                  } finally {
                    setIsLoadingVideo(false);
                  }
                } else {
                  toast.error('영상을 불러올 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.');
                }
              }}
              onLoadedData={() => console.log('비디오 데이터 로드 완료')}
            >
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              비디오 로딩 중...
            </div>
          )}
        </div>

        {/* 업로드 설정 */}
        <div className="p-4 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">업로드 설정</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-300">영상 제목</label>
                <button
                  onClick={generateTitle}
                  disabled={isGeneratingTitle || !searchKeyword}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                >
                  {isGeneratingTitle ? '생성 중...' : '🤖 AI 제목 생성'}
                </button>
              </div>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                placeholder="영상 제목을 입력하세요"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-300">영상 설명</label>
                <button
                  onClick={() => {
                    if (selectedProducts.length > 0 && searchKeyword) {
                      generateDescription(selectedProducts, searchKeyword);
                    } else {
                      toast.error('상품과 키워드가 필요합니다.');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500"
                >
                  🔄 레퍼럴 링크 재생성
                </button>
              </div>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                rows={6}
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                placeholder="영상 설명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                태그 (쉼표로 구분) 
                <span className="text-xs text-gray-500 ml-1">- 선택사항</span>
              </label>
              <input
                type="text"
                value={videoTags}
                onChange={(e) => setVideoTags(e.target.value)}
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                placeholder="태그1, 태그2, 태그3 (비워둬도 됩니다)"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                썸네일 이미지 
                <span className="text-xs text-green-500 ml-1">- 디폴트 설정됨</span>
              </label>
              <button
                onClick={async () => {
                  try {
                    const filePath = await window.electron.selectImageFile();
                    if (filePath) {
                      setThumbnailPath(filePath);
                    }
                  } catch (error) {
                    console.error('썸네일 선택 중 오류:', error);
                    toast.error('썸네일 선택에 실패했습니다.');
                  }
                }}
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 text-left"
              >
                {thumbnailPath === './thumb_img.png' ? 
                  '📸 기본 썸네일 (thumb_img.png)' : 
                  thumbnailPath.split('/').pop()
                }
              </button>
            </div>

            {uploadStatus && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-200">
                    {uploadStatus}
                  </span>
                  <span className="text-sm text-blue-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-4">
          <button
            onClick={() => {
              const videoPath = generatedVideoUrl?.replace('file://', '') || '';
              if (videoPath && window.electron) {
                window.electron.openFolder(videoPath.substring(0, videoPath.lastIndexOf('/')));
                toast.success('파일 위치를 열었습니다');
              }
            }}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            폴더 열기
          </button>
          <button
            onClick={handleYoutubeUpload}
            disabled={isUploading || !videoTitle.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                업로드 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                유튜브 업로드
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 