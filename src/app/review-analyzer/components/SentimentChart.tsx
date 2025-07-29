'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface SentimentChartProps {
  data: {
    positive: number;
    negative: number;
    neutral: number;
    score: number;
  };
  detailed?: boolean;
}

export default function SentimentChart({ data, detailed = false }: SentimentChartProps) {
  // data가 없거나 undefined인 경우 기본값 사용
  const sentimentData = data || { positive: 0, negative: 0, neutral: 0 };
  
  // score 계산 (positive - negative를 100으로 나눈 값)
  const score = (sentimentData.positive - sentimentData.negative) / 100;
  
  const pieData = [
    { name: '긍정', value: sentimentData.positive, color: '#10B981' },
    { name: '부정', value: sentimentData.negative, color: '#EF4444' },
    { name: '중립', value: sentimentData.neutral, color: '#6B7280' }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">감정 분석 결과</h3>
      
      <div className={detailed ? 'space-y-8' : ''}>
        {/* 파이 차트 */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, '비율']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 범례 */}
        <div className="flex justify-center gap-6">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">
                {item.name} ({item.value}%)
              </span>
            </div>
          ))}
        </div>

        {/* 상세 분석 (detailed 모드일 때만) */}
        {detailed && (
          <>
            {/* 감정 점수 막대 */}
            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900 mb-4">전체 감정 점수</h4>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      score > 0 ? 'bg-green-500' : score < 0 ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{
                      width: `${Math.abs(score) * 50 + 50}%`,
                      marginLeft: score < 0 ? `${50 - Math.abs(score) * 50}%` : '50%'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>매우 부정적</span>
                  <span>중립</span>
                  <span>매우 긍정적</span>
                </div>
                <div className="text-center mt-2">
                  <span className={`text-lg font-bold ${
                    score > 0.3 ? 'text-green-600' : 
                    score < -0.3 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}점
                  </span>
                </div>
              </div>
            </div>

            {/* 마케팅 인사이트 */}
            <div className="mt-8 bg-blue-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-blue-900 mb-2">마케팅 활용 팁</h4>
              <div className="text-sm text-blue-800 space-y-1">
                {sentimentData.positive > 70 && (
                  <p>✨ 긍정 비율이 높습니다! 고객 만족도를 강조한 마케팅이 효과적일 것입니다.</p>
                )}
                {sentimentData.negative > 30 && (
                  <p>⚠️ 부정 리뷰가 상당합니다. 단점을 미리 언급하고 해결책을 제시하세요.</p>
                )}
                {sentimentData.neutral > 40 && (
                  <p>📊 중립적 의견이 많습니다. 명확한 장점을 부각시킨 컨텐츠가 필요합니다.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
