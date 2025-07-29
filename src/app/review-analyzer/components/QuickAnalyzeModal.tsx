'use client';

import { useState } from 'react';
import { XMarkIcon, PlayIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface QuickAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (url: string, options: any) => void;
}

export default function QuickAnalyzeModal({ isOpen, onClose, onAnalyze }: QuickAnalyzeModalProps) {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const quickAnalyze = async () => {
    if (!url.trim()) {
      toast.error('URL을 입력해주세요.');
      return;
    }

    // 간단한 URL 검증
    const supportedPatterns = [
      /coupang\.com\/vp\/products/,
      /aliexpress\.com\/item/,
      /amazon\.com\/.*\/dp\//,
      /amazon\.co\.kr\/.*\/dp\//
    ];

    const isSupported = supportedPatterns.some(pattern => pattern.test(url));
    if (!isSupported) {
      toast.error('지원되지 않는 URL입니다.');
      return;
    }

    // 빠른 분석 시작 (기본 설정으로)
    onAnalyze(url, {
      maxReviews: 50, // 빠른 분석을 위해 50개로 제한
      analysisType: 'basic'
    });

    onClose();
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (error) {
      toast.error('클립보드에서 URL을 가져올 수 없습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PlayIcon className="w-6 h-6 text-blue-600" />
            빠른 분석
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <GlobeAltIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              상품 URL 입력
            </h3>
            <p className="text-sm text-gray-600">
              분석할 상품의 URL을 입력하면 AI가 리뷰를 빠르게 분석해드립니다
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
                onChange={handleUrlChange}
                placeholder="https://www.coupang.com/vp/products/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20"
                autoFocus
              />
              <button
                onClick={pasteFromClipboard}
                className="absolute right-2 top-2 px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                붙여넣기
              </button>
            </div>
          </div>

          {/* 지원 쇼핑몰 */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs font-medium text-blue-900 mb-1">지원되는 쇼핑몰</div>
            <div className="text-xs text-blue-700 space-y-0.5">
              <div>• 쿠팡 (coupang.com)</div>
              <div>• 알리익스프레스 (aliexpress.com)</div>
              <div>• 아마존 (amazon.com, amazon.co.kr)</div>
            </div>
          </div>

          {/* 빠른 분석 특징 */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-900 mb-1">빠른 분석 특징</div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>• 50개 리뷰 기준 약 2-3분 소요</div>
              <div>• 기본 감정 분석 및 키워드 추출</div>
              <div>• 영상 제작에 필요한 핵심 인사이트 제공</div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={quickAnalyze}
              disabled={!url.trim() || isValidating}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <PlayIcon className="w-4 h-4" />
              빠른 분석 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
