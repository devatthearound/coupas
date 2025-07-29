'use client';

import { Button } from "@/components/ui/button";
import { ArrowDownTrayIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';

const HeroSection = () => {
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

  return (
    <section className="pt-24 pb-20 bg-gradient-to-b from-coupas-light to-white">
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
  );
};

export default HeroSection;
