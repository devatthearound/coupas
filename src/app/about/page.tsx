'use client';

import { Button } from "@/components/ui/button";
import { ArrowDownTrayIcon, PlayIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
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

const AboutPage = () => {
  const router = useRouter();

  const handleMacDownload = () => {
    // Detect Mac processor type
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Check if it's Apple Silicon (M1/M2/M3)
    const isAppleSilicon = userAgent.includes('arm') || 
                          userAgent.includes('aarch64') || 
                          platform.includes('arm') ||
                          (userAgent.includes('mac') && userAgent.includes('intel') === false && 
                           (userAgent.includes('safari') && !userAgent.includes('chrome')));
    
    if (isAppleSilicon) {
      // Apple Silicon (ARM64) version
      window.open('https://github.com/devatthearound/coupas/releases/download/v0.0.1/coupas-mac-0.0.1-arm64.dmg', '_blank');
    } else {
      // Intel x64 version
      window.open('https://github.com/devatthearound/coupas/releases/download/v0.0.1/coupas-mac-0.0.1-x64.dmg', '_blank');
    }
  };

  const handleWindowsDownload = () => {
    window.open('https://github.com/devatthearound/coupas/releases/download/v0.0.1/coupas-win-0.0.1-x64.exe', '_blank');
  };

  const handleStartClick = () => {
    router.push('/search');
  };

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button 
              className="flex items-center text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100"
              onClick={handleBackClick}
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              홈으로 돌아가기
            </Button>
            <div className="text-xl font-bold text-coupas-dark">
              쿠파스 소개
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-16 pb-20 bg-gradient-to-b from-coupas-light to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-8 mb-10 md:mb-0 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-coupas-dark mb-6">
                  쿠팡 파트너스 <span className="text-coupas-primary">영상 생성기</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  쿠팡 상품을 검색하고 영상을 자동으로 생성하세요.
                  API 연동, 자동 유튜브 업로드까지 한 번에!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="bg-coupas-primary hover:bg-coupas-secondary text-white px-8 py-6 text-lg"
                    onClick={handleStartClick}
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    1분만에 영상 만들기
                  </Button>
                  <Button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-6 text-lg"
                    onClick={handleMacDownload}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    다운로드
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="relative">
                  {/* YouTube 동영상 대신 기존 동영상 사용 */}
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="aspect-video">
                      <iframe 
                        className="w-full h-full rounded-lg"
                        src="https://www.youtube.com/embed/7RXVPu7CZRA?si=oHvdMsdHON_bzfLc" 
                        title="쿠파스 소개 영상" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-coupas-primary text-white px-4 py-2 rounded-lg text-sm font-medium animate-bounce-subtle">
                    v1.0.11 출시!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
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

        {/* Additional Info Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-coupas-dark mb-4">
                왜 쿠파스를 선택해야 할까요?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                쿠팡 파트너스 마케팅을 위한 최적의 솔루션
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-coupas-dark mb-4">🚀 빠른 시작</h3>
                <p className="text-gray-600 mb-4">
                  복잡한 설정 없이 바로 시작할 수 있습니다. 쿠팡 파트너스 API 연동부터 영상 제작까지 모든 과정이 자동화되어 있습니다.
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• 1분 만에 영상 제작 시작</li>
                  <li>• 직관적인 사용자 인터페이스</li>
                  <li>• 자동 템플릿 적용</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-coupas-dark mb-4">💡 스마트 기능</h3>
                <p className="text-gray-600 mb-4">
                  AI 기반 레이아웃 최적화와 자동 업로드 기능으로 효율적인 마케팅을 지원합니다.
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• AI 레이아웃 최적화</li>
                  <li>• 자동 유튜브 업로드</li>
                  <li>• 실시간 성과 분석</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-coupas-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              쿠팡 파트너스 마케팅을 위한 최고의 도구를 무료로 체험해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-white text-coupas-primary hover:bg-gray-100 px-8 py-6 text-lg"
                onClick={handleStartClick}
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                무료로 시작하기
              </Button>
              <Button 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-coupas-primary px-8 py-6 text-lg"
                onClick={handleMacDownload}
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                다운로드
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage; 