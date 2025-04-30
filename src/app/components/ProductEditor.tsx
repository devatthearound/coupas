// ProductEditor 컴포넌트 추가

import Image from "next/image";
import { useState } from "react";

type ProductData = {
    keyword: string;
    rank: number;
    isRocket: boolean;
    productId: number;
    productImage: string;
    productName: string;
    productPrice: number;
    productUrl: string;
    shortUrl: string;
    rating: number;
    ratingCount: number;
    features: string;
    isFreeShipping: boolean;
    discountRate: number;
}       
function ProductEditor({ 
    products, 
    onChange 
}: { 
    products: ProductData, 
    onChange: (products: ProductData) => void 
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleProductChange = (field: keyof ProductData, value: any) => {
        onChange({
            ...products,
            [field]: value
        });
    };

    return (
        <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                {/* 아코디언 헤더 */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <div className="flex flex-col w-full">
                        {/* 상단 행: 기본 정보 */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-md overflow-hidden">
                                <Image
                                    width={40} 
                                    height={40} 
                                    src={products.productImage} 
                                    alt={products.productName} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {products.rank}순위: {products.productName || '상품명 미입력'}
                            </span>
                            <span className="text-sm text-gray-500">
                                {products.productPrice?.toLocaleString()}원
                            </span>
                        </div>
                        
                        {/* 하단 행: 추가 정보 */}
                        {!isExpanded && (
                            <div className="flex flex-wrap gap-2 ml-[52px] text-xs">
                                {/* 평점 정보 */}
                                <span className={`px-2 py-1 rounded ${
                                    products.rating 
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' 
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                }`}>
                                    ⭐ {products.rating 
                                        ? `${products.rating.toFixed(1)} (${products.ratingCount?.toLocaleString() || 0})` 
                                        : '평점 미입력'}
                                </span>

                                {/* 할인율 정보 */}
                                <span className={`px-2 py-1 rounded ${
                                    products.discountRate > 0
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                }`}>
                                    {products.discountRate > 0 
                                        ? `${products.discountRate}% 할인` 
                                        : '할인 없음'}
                                </span>

                                {/* 로켓배송 정보 */}
                                <span className={`px-2 py-1 rounded ${
                                    products.isRocket
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                }`}>
                                    {products.isRocket 
                                        ? '🚀 로켓배송' 
                                        : '일반배송'}
                                </span>

                                {/* 상품 특징 정보 */}
                                <span className={`px-2 py-1 rounded truncate max-w-[300px] ${
                                    products.features
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                }`}>
                                    📝 {products.features || '특징 미입력'}
                                </span>

                                {/* 상품 링크 정보 */}
                                <span className={`px-2 py-1 rounded truncate max-w-[200px] ${
                                    products.shortUrl
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                }`}>
                                    🔗 {products.shortUrl || '링크 미입력'}
                                </span>
                            </div>
                        )}
                    </div>
                    <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* 아코디언 콘텐츠 */}
                {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    순위
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={products.rank || ''}
                                    onChange={(e) => handleProductChange('rank', e.target.value ? Number(e.target.value) : null)}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    상품명
                                </label>
                                <input
                                    type="text"
                                    value={products.productName}
                                    onChange={(e) => handleProductChange('productName', e.target.value)}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>
                            
                            {/* 나머지 입력 필드들... */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    가격
                                </label>
                                <input
                                    type="number"
                                    value={products.productPrice || ''}
                                    onChange={(e) => handleProductChange('productPrice', e.target.value ? Number(e.target.value) : null)}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    평점 (별점)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={products.rating || ''}
                                    onChange={(e) => {
                                        handleProductChange('rating', e.target.value ? Number(e.target.value) : null);
                                    }}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    평점 갯수
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={products.ratingCount || ''}
                                    onChange={(e) => {
                                        handleProductChange('ratingCount', e.target.value ? Number(e.target.value) : null);
                                    }}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    특징
                                </label>
                                <textarea
                                    value={products.features || ''}
                                    onChange={(e) => {
                                        handleProductChange('features', e.target.value);
                                    }}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4] min-h-[80px]"
                                    placeholder="상품의 주요 특징을 입력하세요"
                                />
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={products.isRocket}
                                        onChange={(e) => {
                                            handleProductChange('isRocket', e.target.checked);
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">로켓배송(오늘사면 내일도착)</span>
                                </label>
                                {/* <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={products.isFreeShipping}
                                        onChange={(e) => {
                                            handleProductChange('isFreeShipping', e.target.checked);
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">무료배송</span>
                                </label> */}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    할인율 (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={products.discountRate || ''}
                                    onChange={(e) => {
                                        handleProductChange('discountRate', e.target.value ? Number(e.target.value) : null);
                                    }}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    상품 링크
                                </label>
                                <input
                                    type="text"
                                    value={products.shortUrl}
                                    onChange={(e) => {
                                        handleProductChange('shortUrl', e.target.value);
                                    }}
                                    className="block w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md
                                      py-2 px-3 focus:outline-none focus:border-[#514FE4]"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


export default ProductEditor;