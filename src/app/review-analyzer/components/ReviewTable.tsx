'use client';

import { useState } from 'react';
import { StarIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface Review {
  id: string;
  rating: number;
  text: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  helpfulCount: number;
}

interface ReviewTableProps {
  reviews: Review[];
}

export default function ReviewTable({ reviews }: ReviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful' | 'sentiment'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 필터링 및 검색
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;
    const matchesSentiment = sentimentFilter === 'all' || review.sentiment === sentimentFilter;
    
    return matchesSearch && matchesRating && matchesSentiment;
  });

  // 정렬
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'helpful':
        return b.helpfulCount - a.helpfulCount;
      case 'sentiment':
        return b.sentimentScore - a.sentimentScore;
      case 'date':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  // 페이지네이션
  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = sortedReviews.slice(startIndex, startIndex + itemsPerPage);

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '❓';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          리뷰 상세 분석 ({filteredReviews.length}개)
        </h3>
      </div>

      {/* 필터 및 검색 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* 검색 */}
        <div className="relative md:col-span-2">
          <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="리뷰 내용 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 평점 필터 */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">모든 평점</option>
          <option value={5}>5점</option>
          <option value={4}>4점</option>
          <option value={3}>3점</option>
          <option value={2}>2점</option>
          <option value={1}>1점</option>
        </select>

        {/* 감정 필터 */}
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">모든 감정</option>
          <option value="positive">😊 긍정</option>
          <option value="negative">😞 부정</option>
          <option value="neutral">😐 중립</option>
        </select>

        {/* 정렬 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="date">최신순</option>
          <option value="rating">평점순</option>
          <option value="helpful">도움됨순</option>
          <option value="sentiment">감정점수순</option>
        </select>
      </div>

      {/* 리뷰 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">평점</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">감정</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">리뷰 내용</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">날짜</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">도움됨</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.map((review, index) => (
              <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">{review.rating}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    getSentimentColor(review.sentiment)
                  }`}>
                    {getSentimentEmoji(review.sentiment)}
                    {review.sentiment}
                  </span>
                </td>
                <td className="py-4 px-4 max-w-md">
                  <div className="text-sm text-gray-900 line-clamp-3">
                    {review.text}
                  </div>
                  {review.text.length > 100 && (
                    <button className="text-blue-600 text-xs mt-1 hover:underline">
                      더보기
                    </button>
                  )}
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {new Date(review.date).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {review.helpfulCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedReviews.length)} of {sortedReviews.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>
            
            {/* 페이지 번호들 */}
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-lg text-sm ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 분석 인사이트 */}
      <div className="mt-8 bg-yellow-50 rounded-lg p-4">
        <h4 className="text-md font-medium text-yellow-800 mb-2">📊 리뷰 분석 인사이트</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-yellow-700">
            <span className="font-medium">평균 리뷰 길이:</span>
            <span className="ml-1">
              {Math.round(reviews.reduce((sum, r) => sum + r.text.length, 0) / reviews.length)}자
            </span>
          </div>
          <div className="text-yellow-700">
            <span className="font-medium">최다 평점:</span>
            <span className="ml-1">
              {[1,2,3,4,5].reduce((max, rating) => 
                reviews.filter(r => r.rating === rating).length > 
                reviews.filter(r => r.rating === max).length ? rating : max
              )}점
            </span>
          </div>
          <div className="text-yellow-700">
            <span className="font-medium">도움됨 평균:</span>
            <span className="ml-1">
              {Math.round(reviews.reduce((sum, r) => sum + r.helpfulCount, 0) / reviews.length)}회
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
