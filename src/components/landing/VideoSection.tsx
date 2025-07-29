import { PlayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

const VideoSection = () => {
  return (
    <section id="video" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-coupas-dark mb-4">
            영상 자동 제작 및 업로드
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            쿠팡 상품을 선택하면 자동으로 영상이 제작되고 유튜브에 업로드됩니다. 
            인트로, 아웃트로, 배경음악을 설정하고 템플릿을 선택하여 쉽게 영상을 만들어보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in">
            <h3 className="text-xl font-semibold mb-4 text-coupas-dark flex items-center">
              <PlayIcon className="w-6 h-6 mr-2 text-coupas-primary" />
              영상 만들기
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 mb-4 border">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm">키워드 입력</span>
                  <span className="text-xs text-gray-500">✓ 완료</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm">템플릿 선택</span>
                  <span className="text-xs text-gray-500">✓ 완료</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm">음악 설정</span>
                  <span className="text-xs text-gray-500">✓ 완료</span>
                </div>
                <div className="p-3 bg-coupas-primary text-white rounded text-center">
                  영상 생성 중... 85%
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              키워드 입력, 템플릿 선택, 음악 설정까지 단 몇 분이면 전문적인 상품 소개 영상이 완성됩니다.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-xl font-semibold mb-4 text-coupas-dark flex items-center">
              <ArrowUpTrayIcon className="w-6 h-6 mr-2 text-coupas-primary" />
              유튜브 업로드
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 mb-4 border">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm">제목 자동 생성</span>
                  <span className="text-xs text-gray-500">✓ 완료</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm">설명 자동 생성</span>
                  <span className="text-xs text-gray-500">✓ 완료</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm">태그 자동 생성</span>
                  <span className="text-xs text-gray-500">✓ 완료</span>
                </div>
                <div className="p-3 bg-green-500 text-white rounded text-center">
                  업로드 완료!
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              한 번의 클릭으로 생성된 영상을 유튜브에 자동 업로드하고 SEO에 최적화된 제목, 설명, 태그까지 설정됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
