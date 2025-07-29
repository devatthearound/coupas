'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  GlobeAltIcon, 
  Cog6ToothIcon, 
  PlayIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/solid';

interface URLInputFormProps {
  onStartAnalysis: (url: string, options: any) => void;
}

export default function URLInputForm({ onStartAnalysis }: URLInputFormProps) {
  const [url, setUrl] = useState('');
  const [maxReviews, setMaxReviews] = useState(100);
  const [analysisType, setAnalysisType] = useState<'basic' | 'advanced'>('basic');
  const [isValidating, setIsValidating] = useState(false);
  const [productPreview, setProductPreview] = useState<any>(null);

  // URL 유효성 검증
  const validateURL = async (inputUrl: string) => {
    if (!inputUrl.trim()) return false;

    // 지원되는 쇼핑몰 패턴
    const supportedPatterns = [
      /coupang\.com\/vp\/products/,
      /aliexpress\.com\/item/,
      /amazon\.com\/.*\/dp\//,
      /amazon\.co\.kr\/.*\/dp\//
    ];

    const isSupported = supportedPatterns.some(pattern => pattern.test(inputUrl));
    if (!isSupported) {
      toast.error('지원되지 않는 쇼핑몰입니다. 쿠팡, 알리익스프레스, 아마존 상품 URL을 입력해주세요.');
      return false;
    }

    return true;
  };

  // 상품 정보 미리보기
  const previewProduct = async (inputUrl: string) => {
    if (!await validateURL(inputUrl)) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/review-analyzer/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      });

      const data = await response.json();
      if (data.success) {
        setProductPreview(data.product);
      } else {
        toast.error(data.error || '상품 정보를 가져올 수 없습니다.');
        setProductPreview(null);
      }
    } catch (error) {
      toast.error('상품 정보 확인 중 오류가 발생했습니다.');
      setProductPreview(null);
    } finally {
      setIsValidating(false);
    }
  };

  // URL 변경 핸들러
  const handleURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setProductPreview(null);

    // 디바운싱으로 자동 미리보기
    if (newUrl.trim()) {
      const timer = setTimeout(() => {
        previewProduct(newUrl);
      }, 1000);
      return () => clearTimeout(timer);
    }
  };

  // 분석 시작
  const handleStartAnalysis = () => {
    if (!url.trim()) {
      toast.error('상품 URL을 입력해주세요.');
      return;
    }

    if (!productPreview) {
      toast.error('상품 정보를 확인할 수 없습니다. URL을 다시 확인해주세요.');
      return;
    }

    onStartAnalysis(url, {
      maxReviews,
      analysisType,
      productInfo: productPreview
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 메인 입력 카드 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <GlobeAltIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            상품 URL 입력
          </h2>
          <p className="text-gray-600">
            분석할 쿠팡, 알리익스프레스, 아마존 상품 URL을 입력하세요
          </p>
        </div>

        {/* URL 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상품 URL
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={handleURLChange}
              placeholder="https://www.coupang.com/vp/products/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isValidating && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* 상품 미리보기 */}
        {productPreview && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-2">상품 미리보기</h3>
            <div className="flex items-start gap-4">
              {productPreview.image && (
                <img 
                  src={productPreview.image} 
                  alt={productPreview.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {productPreview.title}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>평점: {productPreview.rating}/5.0</div>
                  <div>리뷰 수: {productPreview.reviewCount?.toLocaleString()}개</div>
                  <div>가격: {productPreview.price}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 분석 옵션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분석할 리뷰 수
            </label>
            <select
              value={maxReviews}
              onChange={(e) => setMaxReviews(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={50}>50개 (빠른 분석)</option>
              <option value={100}>100개 (권장)</option>
              <option value={200}>200개 (상세 분석)</option>
              <option value={500}>500개 (심화 분석)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              리뷰 수가 많을수록 더 정확한 분석이 가능하지만 시간이 오래 걸립니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분석 타입
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="analysisType"
                  value="basic"
                  checked={analysisType === 'basic'}
                  onChange={(e) => setAnalysisType(e.target.value as 'basic')}
                  className="mr-3"
                />
                <span className="text-sm">기본 분석 (빠름)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="analysisType"
                  value="advanced"
                  checked={analysisType === 'advanced'}
                  onChange={(e) => setAnalysisType(e.target.value as 'advanced')}
                  className="mr-3"
                />
                <span className="text-sm">고급 분석 (정확함)</span>
              </label>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={handleStartAnalysis}
          disabled={!productPreview || isValidating}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <PlayIcon className="w-5 h-5" />
          AI 리뷰 분석 시작
        </button>
      </div>

      {/* 지원 쇼핑몰 안내 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">지원되는 쇼핑몰</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 쿠팡: https://www.coupang.com/vp/products/...</li>
              <li>• 알리익스프레스: https://aliexpress.com/item/...</li>
              <li>• 아마존: https://amazon.com/.../dp/... 또는 https://amazon.co.kr/.../dp/...</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
