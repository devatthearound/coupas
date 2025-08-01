'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { searchProducts } from '@/services/coupang/searchProducts';
import { ProductData } from '@/services/coupang/types';
import { getCoupangApiKeys } from '@/services/coupang/keys';
import { FireIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 5; // 기본값 5개 고정
  
  // 디폴트 HOT 키워드 (API 실패 시에만 사용)
  const defaultHotKeywords = ['무선 이어폰', '스마트워치', '공기청정기', '로봇청소기', '가습기'];
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(true);

  // 추천 키워드 로드 (YouTube 봇에서 수집된 실시간 데이터)
  const loadTrendingKeywords = async () => {
    try {
      setIsLoadingKeywords(true);
      const response = await fetch('/api/trending-keywords');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.keywords?.length > 0) {
          setTrendingKeywords(data.data.keywords);
          console.log('YouTube 봇에서 수집된 키워드:', data.data.keywords);
        } else {
          console.log('API에서 키워드를 찾을 수 없음, 기본 키워드 사용');
          setTrendingKeywords(defaultHotKeywords);
        }
      } else {
        console.error('API 응답 오류:', response.status);
        setTrendingKeywords(defaultHotKeywords);
      }
    } catch (error) {
      console.error('추천 키워드 로드 실패:', error);
      setTrendingKeywords(defaultHotKeywords);
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  useEffect(() => {
    loadTrendingKeywords();
    
    // 5분마다 키워드 새로고침 (선택사항)
    const interval = setInterval(() => {
      console.log('키워드 새로고침 중...');
      loadTrendingKeywords();
    }, 5 * 60 * 1000); // 5분
    
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (keyword?: string) => {
    const searchKeyword = keyword || searchQuery.trim();
    
    if (!searchKeyword) {
      toast.error('검색어를 입력해주세요');
      return;
    }

    // 키워드가 매개변수로 전달된 경우 상태도 업데이트
    if (keyword) {
      setSearchQuery(keyword);
    }

    const keys = await getCoupangApiKeys();
    
    if (!keys) {
      toast.error('API 키가 없습니다. 설정 페이지에서 설정해주세요.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const products = await searchProducts({
        keyword: searchKeyword,
        limit: limit,
        accessKey: keys.accessKey,
        secretKey: keys.secretKey,
      })

      setSearchResults(products);
      setSelectedProducts(products); // 자동으로 모든 상품 선택
      
      // 키워드를 세션에 저장
      sessionStorage.setItem('search-keyword', searchKeyword);
      
      // 자동으로 다음 페이지로 이동
      setTimeout(() => {
        handleNext(products, searchKeyword);
      }, 1500);

    } catch (error) {
      console.error('검색 실패:', error);
      toast.error('상품 검색에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = (products: ProductData[], searchKeyword: string) => {
    if (products.length === 0) {
      toast.error('검색된 상품이 없습니다');
      return;
    }

    // 세션에 데이터 저장
    const sessionKey = 'coupang-selected-products';
    sessionStorage.setItem(sessionKey, JSON.stringify(products));
    sessionStorage.setItem('search-keyword', searchKeyword);

    // URL에는 세션 키만 포함시킵니다.
    router.push(`/products?selectedProducts=${sessionKey}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">키워드 검색</h1>
          <div className="ml-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">1/2 단계</div>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
            placeholder="검색어를 입력하세요"
            disabled={isLoading}
            className={`flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:ring-2 focus:ring-[#514FE4] dark:focus:ring-[#6C63FF] focus:border-transparent
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-base
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className={`px-8 py-3 bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] 
              dark:hover:bg-[#5B54E8] text-white rounded-lg transition-all font-medium
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                검색 중...
              </span>
            ) : (
              '검색'
            )}
          </button>
        </div>

        {/* 오늘의 추천 키워드 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">오늘의 HOT 키워드</h2>
              {isLoadingKeywords ? (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  업데이트 중
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">실시간</span>
              )}
            </div>
            <button
              onClick={() => loadTrendingKeywords()}
              disabled={isLoadingKeywords}
              className={`text-xs px-2 py-1 rounded-full transition-all ${
                isLoadingKeywords 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title="키워드 새로고침"
            >
              🔄 새로고침
            </button>
          </div>
          
          {/* 안내 메시지 */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            👆 키워드를 클릭하면 바로 검색이 시작됩니다
          </p>
          
          {isLoadingKeywords ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                YouTube 봇에서 실시간 키워드를 수집 중입니다...
              </div>
            </div>
          ) : trendingKeywords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {trendingKeywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(keyword)}
                  disabled={isLoading}
                  title={`"${keyword}" 키워드로 바로 검색하기`}
                  className={`group px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 
                    dark:from-red-900/20 dark:to-orange-900/20 dark:hover:from-red-900/30 dark:hover:to-orange-900/30
                    border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium 
                    text-red-700 dark:text-red-300 transition-all duration-200 hover:scale-105 hover:shadow-md
                    ${isLoading ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' : 'active:scale-95 cursor-pointer'}`}
                >
                  <span className="flex items-center gap-2 justify-center">
                    <span className="text-sm group-hover:animate-bounce">🔥</span>
                    <span className="font-medium">{keyword}</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">🔍</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              💡 YouTube 봇에서 키워드를 수집하지 못했습니다. 기본 키워드를 사용합니다.
            </div>
          )}
        </div>

        {/* Search Status */}
        {isLoading ? (
          // 검색 중일 때 표시할 로딩 UI
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 mb-4">
              <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              🔍 &quot;{searchQuery}&quot; 검색 중...
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">상위 {limit}개 상품을 가져오는 중...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">잠시 후 자동으로 다음 단계로 이동합니다</p>
          </div>
        ) : (
          // 검색 대기 중일 때 표시할 UI
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 mb-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">키워드를 입력하고 검색해주세요</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">쿠팡 순위 상위 {limit}개 상품이 자동으로 선택됩니다</p>
            
            {/* HOT 키워드 바로 검색 안내 */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-lg p-4 border border-red-100 dark:border-red-800/30">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                💡 위의 <span className="font-bold">HOT 키워드</span>를 클릭하면 바로 검색할 수 있어요!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 