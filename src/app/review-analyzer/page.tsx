'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ChartBarIcon, EyeIcon, DocumentTextIcon, ShareIcon } from '@heroicons/react/24/solid';
import URLInputForm from './components/URLInputForm';
import AnalysisProgress from './components/AnalysisProgress';
import ResultDashboard from './components/ResultDashboard';
import QuickAnalyzeModal from './components/QuickAnalyzeModal';

interface AnalysisState {
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  analysisId?: string;
  results?: any;
  error?: string;
}

export default function ReviewAnalyzerPage() {
  const router = useRouter();
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    currentStep: ''
  });
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  // 상태 변화 로깅
  useEffect(() => {
    console.log('ReviewAnalyzerPage 상태 변화:', analysisState);
  }, [analysisState]);

  // 분석 시작 함수
  const startAnalysis = async (url: string, options: any) => {
    try {
      setAnalysisState({
        status: 'analyzing',
        progress: 0,
        currentStep: 'URL 검증 중...'
      });

      // API 호출로 분석 시작
      const response = await fetch('/api/review-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '분석 시작에 실패했습니다.');
      }

      // 분석 ID 저장하고 진행상황 모니터링 시작
      setAnalysisState(prev => ({
        ...prev,
        analysisId: data.analysisId
      }));

      pollAnalysisStatus(data.analysisId);

    } catch (error: any) {
      setAnalysisState({
        status: 'error',
        progress: 0,
        currentStep: '',
        error: error.message
      });
      toast.error(error.message);
    }
  };

  // 분석 진행상황 폴링
  const pollAnalysisStatus = async (analysisId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/review-analyzer/status/${analysisId}`);
        const data = await response.json();

        setAnalysisState(prev => ({
          ...prev,
          progress: data.progress,
          currentStep: data.message
        }));

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          
          // 결과 가져오기
          const resultsResponse = await fetch(`/api/review-analyzer/results/${analysisId}`);
          const resultsData = await resultsResponse.json();
          
          console.log('Results API 응답:', resultsData);
          
          setAnalysisState({
            status: 'completed',
            progress: 100,
            currentStep: '분석 완료!',
            analysisId,
            results: resultsData.data // resultsData.analysis -> resultsData.data로 수정
          });
          
          toast.success('리뷰 분석이 완료되었습니다!');
        } else if (data.status === 'error') {
          clearInterval(pollInterval);
          setAnalysisState({
            status: 'error',
            progress: 0,
            currentStep: '',
            error: data.error
          });
          toast.error(data.error);
        }
      } catch (error) {
        clearInterval(pollInterval);
        toast.error('분석 상태 확인 중 오류가 발생했습니다.');
      }
    }, 2000);
  };

  // 새 분석 시작
  const resetAnalysis = () => {
    setAnalysisState({
      status: 'idle',
      progress: 0,
      currentStep: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
                리뷰 분석기
              </h1>
              <p className="mt-2 text-gray-600">
                쿠팡, 알리익스프레스, 아마존 상품 리뷰를 AI로 분석하여 마케팅 인사이트를 얻으세요
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsQuickModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                빠른 분석
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analysisState.status === 'idle' && (
          <div>
            <h3 className="text-lg font-medium mb-4">상태: 대기 중</h3>
            <URLInputForm onStartAnalysis={startAnalysis} />
            <div className="mt-4 p-4 bg-blue-50 rounded">
              URLInputForm이 여기에 표시되어야 합니다.
            </div>
          </div>
        )}

        {analysisState.status === 'analyzing' && (
          <div>
            <h3 className="text-lg font-medium mb-4">상태: 분석 중</h3>
            <AnalysisProgress 
              progress={analysisState.progress}
              currentStep={analysisState.currentStep}
              onCancel={resetAnalysis}
            />
          </div>
        )}

        {analysisState.status === 'completed' && (
          <div>
            <h3 className="text-lg font-medium mb-4">상태: 완료</h3>
            {analysisState.results ? (
              <ResultDashboard 
                results={analysisState.results}
                onNewAnalysis={resetAnalysis}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <div className="text-yellow-600 text-lg font-medium mb-4">
                  결과를 불러오는 중...
                </div>
                <div className="text-yellow-500">
                  잠시만 기다려주세요.
                </div>
              </div>
            )}
          </div>
        )}

        {analysisState.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-600 text-lg font-medium mb-4">
              분석 중 오류가 발생했습니다
            </div>
            <div className="text-red-500 mb-6">
              {analysisState.error}
            </div>
            <button
              onClick={resetAnalysis}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}
        
        {/* 디버깅 정보 */}
        <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
          <strong>디버그 정보:</strong> Status = {analysisState.status}
        </div>
      </div>

      {/* 빠른 분석 모달 */}
      <QuickAnalyzeModal 
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        onAnalyze={startAnalysis}
      />
    </div>
  );
}
