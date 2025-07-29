'use client';

import { useState } from 'react';

interface Keyword {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface KeywordCloudProps {
  keywords: Keyword[];
}

export default function KeywordCloud({ keywords }: KeywordCloudProps) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  
  const filteredKeywords = keywords.filter(keyword => 
    filter === 'all' ? true : keyword.sentiment === filter
  );

  const maxCount = Math.max(...keywords.map(k => k.count));
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl';
    if (ratio > 0.6) return 'text-xl';
    if (ratio > 0.4) return 'text-lg';
    if (ratio > 0.2) return 'text-base';
    return 'text-sm';
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">키워드 분석</h3>
        
        {/* 필터 버튼들 */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'positive' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            긍정
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'negative' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            부정
          </button>
          <button
            onClick={() => setFilter('neutral')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'neutral' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            중립
          </button>
        </div>
      </div>

      {/* 키워드 클라우드 */}
      <div className="min-h-64 flex flex-wrap items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
        {filteredKeywords.slice(0, 50).map((keyword, index) => (
          <span
            key={index}
            className={`
              inline-block px-3 py-1 border rounded-full font-medium cursor-pointer
              hover:scale-105 transition-transform duration-200
              ${getFontSize(keyword.count)}
              ${getSentimentColor(keyword.sentiment)}
            `}
            title={`${keyword.word}: ${keyword.count}회 언급`}
          >
            {keyword.word}
          </span>
        ))}
      </div>

      {/* 상위 키워드 순위 */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">키워드 순위 TOP 10</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKeywords.slice(0, 10).map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">
                  #{index + 1}
                </span>
                <span className="font-medium text-gray-900">
                  {keyword.word}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(keyword.sentiment)}`}>
                  {keyword.sentiment === 'positive' ? '😊' : 
                   keyword.sentiment === 'negative' ? '😞' : '😐'}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {keyword.count}회
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 마케팅 키워드 추천 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-md font-medium text-blue-900 mb-2">🎯 마케팅 키워드 추천</h4>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-blue-800">영상 제목 키워드: </span>
            <span className="text-sm text-blue-700">
              {keywords.filter(k => k.sentiment === 'positive').slice(0, 5).map(k => k.word).join(', ')}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-blue-800">해시태그 추천: </span>
            <span className="text-sm text-blue-700">
              {keywords.slice(0, 8).map(k => `#${k.word}`).join(' ')}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-blue-800">주의할 키워드: </span>
            <span className="text-sm text-blue-700">
              {keywords.filter(k => k.sentiment === 'negative').slice(0, 3).map(k => k.word).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
