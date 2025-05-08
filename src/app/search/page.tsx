'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { searchProducts } from '@/services/coupang/searchProducts';
import { ProductData } from '@/services/coupang/types';
import { getCoupangApiKeys, checkCoupangApiKeys } from '@/services/coupang/keys';
import ProductLimitSelector from './components/ProductLimitSelector';
import ProductCard from './components/ProductCard';

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkApiIsLoading, setCheckApiIsLoading] = useState(true);
  const [limit, setLimit] = useState(10); // 기본값 10개
  const [apiKeys, setApiKeys] = useState<{ accessKey: string; secretKey: string } | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState(false);

  useEffect(() => {
    const checkApiConfiguration = async () => {
      try {
        const configured = await checkCoupangApiKeys();
        setIsApiConfigured(configured);
        
        if (configured) {
          const keys = await getCoupangApiKeys();
          setApiKeys(keys);
        }
      } catch (error) {
        console.error('API 키 확인 중 오류:', error);
        toast.error('API 키 확인 중 오류가 발생했습니다.');
      }
      setCheckApiIsLoading(false);
    };

    checkApiConfiguration();
  }, [router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('검색어를 입력해주세요');
      return;
    }

    if (!isApiConfigured) {
      toast.error('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const products = await searchProducts({
        keyword: searchQuery,
        limit: limit,
        accessKey: apiKeys!.accessKey,
        secretKey: apiKeys!.secretKey,
      })

      setSearchResults(products);

    } catch (error) {
      console.error('검색 실패:', error);
      toast.error('검색에 실패했습니다');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = useCallback(() => {
    if (selectedProducts.length === 0) {
      toast.error('최소 1개 이상의 상품을 선택해주세요');
      return;
    }

    // 선택된 제품 정보를 세션 스토리지에 저장합니다.
    const sessionKey = 'coupang-selected-products';
    sessionStorage.setItem(sessionKey, JSON.stringify(selectedProducts));
    sessionStorage.setItem('searchQuery', searchQuery);

    console.log("selectedProducts", selectedProducts);
    // URL에는 세션 키만 포함시킵니다.
    router.push(`/products?selectedProducts=${sessionKey}&searchQuery=${searchQuery}`);
  }, [selectedProducts, searchQuery, router]);

  // 상품 구분을 위한 고유 키 생성 함수 추가
  const getProductKey = (product: ProductData) => `${product.productId}-${product.rank}`;

  if (checkApiIsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 mb-4">
          <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12 w-full  h-full overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            상품 검색
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            1/3 단계
          </div>
        </div>

        {!isApiConfigured ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-16 h-16 mb-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              API 키 설정이 필요합니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
              쿠팡 파트너스 API 키를 설정하면 상품 검색 기능을 사용할 수 있습니다.
              API 키는 쿠팡 파트너스 계정에서 발급받을 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="px-6 py-2 bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] 
                dark:hover:bg-[#5B54E8] text-white rounded-lg transition-colors"
            >
              API 키 설정하기
            </button>
          </div>
        ) : (
          <>
            {/* API 키 정보 표시 */}
            {/* {apiKeys && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">현재 사용 중인 API 키</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Access Key: {apiKeys.accessKey.slice(0, 8)}...{apiKeys.accessKey.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/settings')}
                    className="text-sm text-[#514FE4] hover:text-[#4140B3] dark:text-[#6C63FF] dark:hover:text-[#5B54E8]"
                  >
                    API 키 변경
                  </button>
                </div>
              </div>
            )} */}

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="검색어를 입력하세요"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-[#514FE4] dark:focus:ring-[#6C63FF] focus:border-transparent
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-2 bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] 
                  dark:hover:bg-[#5B54E8] text-white rounded-lg transition-colors"
              >
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>

            {/* 몇개 보여줄지 선택 */}
            <ProductLimitSelector limit={limit} setLimit={setLimit} />

            {/* Search Results */}
            {isLoading ? (
              // 검색 중일 때 표시할 로딩 UI
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 mb-4">
                  <svg className="animate-spin w-full h-full text-[#514FE4] dark:text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">검색 중입니다...</p>
              </div>
            ) : searchResults.length === 0 ? (
              // 검색 결과가 없을 때 표시할 UI
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 mb-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">검색 결과가 없습니다</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">다른 검색어로 시도해보세요</p>
              </div>
            ) : (
              // 검색 결과가 있을 때 표시할 기존 그리드
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.slice(0, limit).map((product) => {
                  const productKey = getProductKey(product);
                  const selectedIndex = selectedProducts.findIndex(p => 
                    getProductKey(p) === productKey
                  );
                  const isSelected = selectedIndex !== -1;

                  return (
                    <ProductCard
                      key={productKey}
                      product={product}
                      isSelected={isSelected}
                      selectIndex={selectedIndex + 1}
                      onSelect={() => {
                        if (isSelected) {
                          setSelectedProducts(prev => 
                            prev.filter(p => getProductKey(p) !== productKey)
                          );
                        } else if (selectedProducts.length < limit) {
                          setSelectedProducts(prev => [...prev, product]);
                        } else {
                          toast.error(`최대 ${limit}개까지 선택할 수 있습니다`);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      {isApiConfigured && (
        <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 
          border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProducts.length}/{limit}개 선택됨
              </div>
              <button
                onClick={handleNext}
                disabled={selectedProducts.length === 0}
                className={`px-6 py-2.5 rounded-lg transition-colors font-medium ${
                  selectedProducts.length > 0
                    ? 'bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 