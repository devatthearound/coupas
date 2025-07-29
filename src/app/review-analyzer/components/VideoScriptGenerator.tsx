'use client';

import { useState } from 'react';
import { PlayIcon, DocumentDuplicateIcon, ShareIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface VideoScriptGeneratorProps {
  analysisResults: any;
  onGenerate: (script: any) => void;
}

export default function VideoScriptGenerator({ analysisResults, onGenerate }: VideoScriptGeneratorProps) {
  const [scriptType, setScriptType] = useState<'promotional' | 'review' | 'comparison'>('promotional');
  const [tone, setTone] = useState<'enthusiastic' | 'professional' | 'casual'>('enthusiastic');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const scriptTypes = {
    promotional: { label: '홍보형', description: '상품의 장점을 강조하는 판매 중심 스크립트' },
    review: { label: '리뷰형', description: '객관적인 리뷰 분석을 바탕으로 한 정보 전달형' },
    comparison: { label: '비교형', description: '경쟁사 대비 장단점을 비교 분석하는 형태' }
  };

  const tones = {
    enthusiastic: { label: '열정적', description: '에너지 넘치고 흥미진진한 톤' },
    professional: { label: '전문적', description: '신뢰할 수 있고 정확한 정보 전달' },
    casual: { label: '친근한', description: '일상적이고 편안한 대화체' }
  };

  const durations = {
    short: { label: '숏폼 (30초-1분)', wordCount: '100-150단어' },
    medium: { label: '미디움 (2-3분)', wordCount: '250-350단어' },
    long: { label: '롱폼 (5-7분)', wordCount: '500-700단어' }
  };

  const generateScript = async () => {
    setIsGenerating(true);
    try {
      // 분석 결과를 바탕으로 AI 스크립트 생성 API 호출
      const response = await fetch('/api/review-analyzer/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResults,
          scriptType,
          tone,
          duration
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedScript(data.script);
        onGenerate(data.script);
        toast.success('영상 스크립트가 생성되었습니다!');
      } else {
        throw new Error(data.error || '스크립트 생성에 실패했습니다.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('클립보드에 복사되었습니다!');
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-8">
      {/* 스크립트 생성 설정 */}
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          AI 영상 스크립트 생성기
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 스크립트 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">스크립트 타입</label>
            <div className="space-y-2">
              {Object.entries(scriptTypes).map(([key, type]) => (
                <label key={key} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="scriptType"
                    value={key}
                    checked={scriptType === key}
                    onChange={(e) => setScriptType(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 톤 앤 매너 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">톤 앤 매너</label>
            <div className="space-y-2">
              {Object.entries(tones).map(([key, toneOption]) => (
                <label key={key} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tone"
                    value={key}
                    checked={tone === key}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{toneOption.label}</div>
                    <div className="text-xs text-gray-600">{toneOption.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 영상 길이 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">영상 길이</label>
            <div className="space-y-2">
              {Object.entries(durations).map(([key, durationOption]) => (
                <label key={key} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="duration"
                    value={key}
                    checked={duration === key}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{durationOption.label}</div>
                    <div className="text-xs text-gray-600">{durationOption.wordCount}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={generateScript}
            disabled={isGenerating}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                생성 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                AI 스크립트 생성하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 생성된 스크립트 */}
      {generatedScript && (
        <div className="bg-white rounded-lg p-6 border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">생성된 영상 스크립트</h3>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generatedScript.fullScript)}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
                복사
              </button>
              <button
                onClick={() => {/* 공유 기능 */}}
                className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
              >
                <ShareIcon className="w-4 h-4" />
                공유
              </button>
            </div>
          </div>

          {/* 메타데이터 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">제목</div>
              <div className="font-medium text-gray-900">{generatedScript.title}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">예상 재생시간</div>
              <div className="font-medium text-gray-900">{generatedScript.estimatedDuration}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">단어 수</div>
              <div className="font-medium text-gray-900">{generatedScript.wordCount}개</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">마케팅 점수</div>
              <div className="font-medium text-green-600">{generatedScript.marketingScore}/100</div>
            </div>
          </div>

          {/* 스크립트 섹션들 */}
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🎬 인트로 (0-10초)</h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{generatedScript.intro}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">📝 메인 컨텐츠</h4>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{generatedScript.mainContent}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">🔚 아웃트로 & CTA</h4>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{generatedScript.outro}</p>
              </div>
            </div>
          </div>

          {/* 추천 태그 및 키워드 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🏷️ 추천 해시태그</h4>
              <div className="flex flex-wrap gap-2">
                {generatedScript.hashtags?.map((tag: string, index: number) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🎯 핵심 키워드</h4>
              <div className="flex flex-wrap gap-2">
                {generatedScript.keywords?.map((keyword: string, index: number) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 마케팅 팁 */}
          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">💡 마케팅 활용 팁</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {generatedScript.marketingTips?.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
