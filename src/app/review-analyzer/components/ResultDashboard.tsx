'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PlayIcon,
  StarIcon,
  EyeIcon
} from '@heroicons/react/24/solid';
import SentimentChart from './SentimentChart';
import KeywordCloud from './KeywordCloud';
import ReviewTable from './ReviewTable';
import VideoScriptGenerator from './VideoScriptGenerator';

interface ResultDashboardProps {
  results: any;
  onNewAnalysis: () => void;
}

export default function ResultDashboard({ results, onNewAnalysis }: ResultDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'keywords' | 'reviews' | 'script'>('overview');

  const tabs = [
    { id: 'overview', label: '종합 요약', icon: ChartBarIcon },
    { id: 'sentiment', label: '감정 분석', icon: EyeIcon },
    { id: 'keywords', label: '키워드 분석', icon: DocumentTextIcon },
    { id: 'reviews', label: '리뷰 상세', icon: StarIcon },
    { id: 'script', label: '영상 스크립트', icon: PlayIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 - 상품 정보 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            {results.productInfo?.image && (
              <img 
                src={results.productInfo.image} 
                alt={results.productInfo.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                분석 결과
              </h1>
              <h2 className="text-lg text-gray-700 mb-2">
                {results.productInfo?.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>평점: {results.productInfo?.rating}/5.0</span>
                <span>리뷰: {results.statistics?.totalReviews}개 분석</span>
                <span>완료: {new Date(results.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open(results.downloadUrls?.report, '_blank')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              보고서 다운로드
            </button>
            <button
              onClick={onNewAnalysis}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              새 분석
            </button>
          </div>
        </div>

        {/* 핵심 지표 카드들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {results.reviewSummary?.totalReviews}
            </div>
            <div className="text-sm text-gray-600">총 리뷰 수</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {results.reviewSummary?.averageRating?.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">평균 평점</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {results.sentimentAnalysis?.positive}%
            </div>
            <div className="text-sm text-gray-600">긍정 비율</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {results.sentimentAnalysis?.positive > 50 ? '+' : ''}{results.sentimentAnalysis?.positive || 0}
            </div>
            <div className="text-sm text-gray-600">감정 점수</div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* 마케팅 인사이트 요약 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🎯 마케팅 핵심 인사이트
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">강점 포인트</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {results.marketingInsights?.strengths?.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">주의 사항</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {results.marketingInsights?.concerns?.map((concern: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">⚠</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 차트 그리드 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SentimentChart data={results.sentimentAnalysis} />
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">평점 분포</h3>
                  {/* 평점 분포 차트 컴포넌트 */}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sentiment' && (
            <div className="space-y-8">
              <SentimentChart data={results.sentimentAnalysis} detailed />
              {/* 감정별 대표 리뷰 */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">감정별 대표 리뷰</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">😊 긍정 리뷰</h4>
                    <div className="text-sm text-green-700 space-y-2">
                      {results.representativeReviews?.positive?.slice(0, 3).map((review: any, idx: number) => (
                        <div key={idx} className="bg-white rounded p-2">
                          『{review.text}』
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">😞 부정 리뷰</h4>
                    <div className="text-sm text-red-700 space-y-2">
                      {results.representativeReviews?.negative?.slice(0, 3).map((review: any, idx: number) => (
                        <div key={idx} className="bg-white rounded p-2">
                          『{review.text}』
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">😐 중립 리뷰</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      {results.representativeReviews?.neutral?.slice(0, 3).map((review: any, idx: number) => (
                        <div key={idx} className="bg-white rounded p-2">
                          『{review.text}』
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-8">
              <KeywordCloud keywords={results.keywords} />
              {/* 키워드 활용 가이드 */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  🎬 영상 제작 키워드 활용 가이드
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">제목 추천 키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.keywords?.slice(0, 8).map((keyword: any, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {keyword.word}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">태그 추천 키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.keywords?.slice(8, 16).map((keyword: any, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          #{keyword.word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewTable reviews={results.rawReviews || []} />
          )}

          {activeTab === 'script' && (
            <VideoScriptGenerator 
              analysisResults={results}
              onGenerate={(script) => console.log('Generated script:', script)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
