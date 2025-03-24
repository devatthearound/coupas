'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { searchProducts } from '@/services/coupang/searchProducts';
import { ProductData } from '@/services/coupang/types';
import { getCoupangApiKeys } from '@/services/coupang/keys';
import ProductLimitSelector from './components/ProductLimitSelector';
import ProductCard from './components/ProductCard';

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(10); // 기본값 10개

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('검색어를 입력해주세요');
      return;
    }

    setIsLoading(true);

    const keys = await getCoupangApiKeys();
    
    if (!keys) {
      toast.error('API 키가 없습니다. 설정 페이지에서 설정해주세요.');
      return;
    }

    try {
      const products = await searchProducts({
        keyword: searchQuery,
        limit: limit,
        accessKey: keys.accessKey,
        secretKey: keys.secretKey,
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

  const handleNext = () => {
    if (selectedProducts.length === 0) {
      toast.error('최소 1개 이상의 상품을 선택해주세요');
      return;
    }

    // 선택된 제품 정보를 세션 스토리지에 저장합니다.
    const sessionKey = 'coupang-selected-products';
    sessionStorage.setItem(sessionKey, JSON.stringify(selectedProducts));

    console.log("selectedProducts", selectedProducts);
    // URL에는 세션 키만 포함시킵니다.
    router.push(`/products?selectedProducts=${sessionKey}`);
  };

  // 상품 구분을 위한 고유 키 생성 함수 추가
  const getProductKey = (product: ProductData) => `${product.productId}-${product.rank}`;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            상품 검색
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            1/3 단계
          </div>
        </div>

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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 
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
    </div>
  );
} 