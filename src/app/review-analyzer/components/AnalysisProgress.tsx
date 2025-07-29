'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/solid';

interface AnalysisProgressProps {
  progress: number;
  currentStep: string;
  onCancel: () => void;
}

export default function AnalysisProgress({ progress, currentStep, onCancel }: AnalysisProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 진행률에 따른 예상 완료 시간 계산
    if (progress > 0) {
      const totalEstimated = Math.round((elapsedTime / progress) * 100);
      setEstimatedTime(Math.max(0, totalEstimated - elapsedTime));
    }
  }, [progress, elapsedTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageInfo = () => {
    if (progress < 20) return { stage: '준비', color: 'bg-blue-500', icon: '🔍' };
    if (progress < 70) return { stage: '크롤링', color: 'bg-green-500', icon: '📊' };
    if (progress < 90) return { stage: 'AI 분석', color: 'bg-purple-500', icon: '🤖' };
    return { stage: '보고서 생성', color: 'bg-orange-500', icon: '📄' };
  };

  const stageInfo = getStageInfo();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            리뷰 분석 진행 중
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 현재 단계 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">{stageInfo.icon}</div>
          <div className="text-lg font-medium text-gray-900 mb-2">
            {stageInfo.stage} 단계
          </div>
          <div className="text-gray-600">
            {currentStep}
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>진행률</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${stageInfo.color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 시간 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <ClockIcon className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <div className="text-sm text-gray-600">경과 시간</div>
            <div className="text-lg font-medium text-gray-900">
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <ClockIcon className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <div className="text-sm text-gray-600">예상 남은 시간</div>
            <div className="text-lg font-medium text-gray-900">
              {estimatedTime > 0 ? formatTime(estimatedTime) : '--:--'}
            </div>
          </div>
        </div>

        {/* 단계별 진행상황 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress >= 20 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-sm ${progress >= 20 ? 'text-gray-900' : 'text-gray-500'}`}>
              상품 정보 확인 및 준비
            </span>
            {progress >= 20 && <span className="text-green-500 text-sm">✓</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress >= 70 ? 'bg-green-500' : (progress >= 20 ? 'bg-blue-500' : 'bg-gray-300')}`} />
            <span className={`text-sm ${progress >= 20 ? 'text-gray-900' : 'text-gray-500'}`}>
              리뷰 데이터 수집
            </span>
            {progress >= 70 && <span className="text-green-500 text-sm">✓</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress >= 90 ? 'bg-green-500' : (progress >= 70 ? 'bg-purple-500' : 'bg-gray-300')}`} />
            <span className={`text-sm ${progress >= 70 ? 'text-gray-900' : 'text-gray-500'}`}>
              AI 감정 분석 및 키워드 추출
            </span>
            {progress >= 90 && <span className="text-green-500 text-sm">✓</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress >= 100 ? 'bg-green-500' : (progress >= 90 ? 'bg-orange-500' : 'bg-gray-300')}`} />
            <span className={`text-sm ${progress >= 90 ? 'text-gray-900' : 'text-gray-500'}`}>
              시각화 및 보고서 생성
            </span>
            {progress >= 100 && <span className="text-green-500 text-sm">✓</span>}
          </div>
        </div>

        {/* 취소 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            분석 취소
          </button>
        </div>
      </div>

      {/* 팁 카드 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 분석 중 팁</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 분석이 완료되면 마케팅에 활용할 수 있는 인사이트를 제공합니다</p>
          <p>• 긍정/부정 리뷰의 주요 키워드를 영상 제작에 활용하세요</p>
          <p>• 경쟁사 상품과 비교 분석하여 차별화 포인트를 찾아보세요</p>
        </div>
      </div>
    </div>
  );
}
