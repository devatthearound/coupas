import { ChartBarIcon, MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const KeywordSection = () => {
  const trendingKeywords = [
    "무선 이어폰", "스마트워치", "공기청정기", "로봇청소기", "가습기",
    "비타민C", "프로틴", "홈트레이닝", "요가매트", "블루투스 스피커"
  ];

  // 고정된 증가율 데이터 (hydration 오류 방지)
  const growthRates = [35, 28, 42, 19, 31];

  return (
    <section id="keywords" className="py-20 bg-coupas-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-coupas-dark mb-4">
            트래픽이 몰리는 키워드 분석
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            유튜브와 쿠팡에서 가장 인기 있는 키워드를 확인하고 영상 제작에 활용하세요. 
            쿠파스는 실시간으로 트렌딩 키워드를 분석해 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="w-8 h-8 text-coupas-primary mr-3" />
              <h3 className="text-xl font-semibold text-coupas-dark">실시간 트렌드</h3>
            </div>
            <div className="space-y-2">
              {trendingKeywords.slice(0, 5).map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{keyword}</span>
                  <span className="text-xs text-green-600">↗ {growthRates[index]}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-coupas-primary mr-3" />
              <h3 className="text-xl font-semibold text-coupas-dark">검색량 분석</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">무선 이어폰</span>
                  <span className="text-xs text-gray-600">월 1.2M</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-coupas-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">스마트워치</span>
                  <span className="text-xs text-gray-600">월 890K</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-coupas-primary h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center mb-4">
              <UserGroupIcon className="w-8 h-8 text-coupas-primary mr-3" />
              <h3 className="text-xl font-semibold text-coupas-dark">타겟 분석</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-1">주요 연령대</div>
                <div className="text-xs text-gray-600">25-34세 (42%)</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-1">관심 카테고리</div>
                <div className="text-xs text-gray-600">전자기기, 헬스케어</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-1">구매 패턴</div>
                <div className="text-xs text-gray-600">리뷰 중심 구매</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 inline-block">
            <p className="text-gray-600">
              <span className="font-semibold text-coupas-primary">쿠파스</span>는 매일 키워드 데이터를 업데이트하여 최신 트렌드를 반영합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KeywordSection;
