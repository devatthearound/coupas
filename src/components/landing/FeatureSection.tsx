import { VideoCameraIcon, LinkIcon, ArrowUpTrayIcon, Cog6ToothIcon, BoltIcon } from "@heroicons/react/24/outline";

const features = [
  {
    icon: <LinkIcon className="w-10 h-10 text-coupas-primary" />,
    title: "쿠팡 파트너스 API 연동",
    description: "쿠팡 파트너스 API를 자동 연동하여 쉽고 빠르게 상품 정보를 가져올 수 있습니다."
  },
  {
    icon: <VideoCameraIcon className="w-10 h-10 text-coupas-primary" />,
    title: "자동 영상 제작",
    description: "선택한 상품들로 템플릿 기반 영상을 자동으로 제작합니다. 인트로, 아웃트로, 배경 음악까지 설정 가능!"
  },
  {
    icon: <BoltIcon className="w-10 h-10 text-coupas-primary" />,
    title: "스마트 레이아웃 최적화",
    description: "상품 정보와 이미지를 자동으로 최적의 레이아웃으로 배치하여 보기 좋은 영상을 제작합니다."
  },
  {
    icon: <ArrowUpTrayIcon className="w-10 h-10 text-coupas-primary" />,
    title: "유튜브 자동 업로드",
    description: "생성된 영상을 원클릭으로 유튜브에 자동으로 업로드하고 설정까지 한 번에 완료할 수 있습니다."
  },
  {
    icon: <Cog6ToothIcon className="w-10 h-10 text-coupas-primary" />,
    title: "템플릿 관리",
    description: "다양한 템플릿을 저장하고 관리하며, 자신만의 커스텀 템플릿을 만들어 영상 제작 효율을 높일 수 있습니다."
  }
];

const FeatureSection = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-coupas-dark mb-4">
            쿠파스의 핵심 기능
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            쿠파스는 쿠팡 파트너스를 위한 최적의 도구로, 상품 검색부터 영상 제작, 유튜브 업로드까지 한 번에 해결합니다.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-coupas-light rounded-full w-16 h-16 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-coupas-dark">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
