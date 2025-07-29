'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDownTrayIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const DownloadSection = () => {
  const [showMacOptions, setShowMacOptions] = useState(false);
  const [detectedMacType, setDetectedMacType] = useState<'apple-silicon' | 'intel' | null>(null);

  // macOS 프로세서 타입 자동 감지
  useEffect(() => {
    const detectMacType = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();
      
      // Mac 여부 먼저 확인
      if (!userAgent.includes('mac') && !platform.includes('mac')) {
        return null;
      }

      // Apple Silicon 감지 (더 정확한 방법)
      const isAppleSilicon = 
        userAgent.includes('arm') || 
        userAgent.includes('aarch64') || 
        platform.includes('arm') ||
        // 최신 Safari에서 M1/M2 감지
        (userAgent.includes('mac') && 
         userAgent.includes('version/') && 
         parseFloat(userAgent.split('version/')[1]) >= 14 &&
         !userAgent.includes('intel'));
      
      return isAppleSilicon ? 'apple-silicon' : 'intel';
    };

    setDetectedMacType(detectMacType());
  }, []);

  // 외부 클릭 시 Mac 옵션 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMacOptions) {
        setShowMacOptions(false);
      }
    };

    if (showMacOptions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMacOptions]);

  const handleWindowsDownload = () => {
    window.open('https://github.com/devatthearound/coupas/releases/download/v0.0.1/coupas-win-0.0.1-x64.exe', '_blank');
  };

  const downloadMacVersion = (type: 'apple-silicon' | 'intel') => {
    if (type === 'apple-silicon') {
      window.open('https://github.com/devatthearound/coupas/releases/download/v0.0.1/coupas-mac-0.0.1-arm64.dmg', '_blank');
    } else {
      window.open('https://github.com/devatthearound/coupas/releases/download/v0.0.1/coupas-mac-0.0.1-x64.dmg', '_blank');
    }
  };

  const handleMacDownload = () => {
    const downloadType = detectedMacType || 'apple-silicon'; // 기본값은 Apple Silicon
    downloadMacVersion(downloadType);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-coupas-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-coupas-dark mb-4">
            쿠파스 지금 다운로드하기
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-3">
            쿠팡 파트너스 영상 자동화의 첫 시작, 지금 바로 쿠파스를 다운로드하세요.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              최신 버전 v0.0.1
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              무료
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-6 animate-fade-in">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center md:w-80">
            <div className="bg-coupas-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coupas-primary">
                <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z"></path>
                <path d="M10 2c1 .5 2 2 2 5"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-coupas-dark">Mac 버전</h3>
            
            {/* 자동 감지 결과 표시 */}
            {detectedMacType && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  🤖 자동 감지: {detectedMacType === 'apple-silicon' ? 'Apple Silicon (M1/M2)' : 'Intel 프로세서'}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-4">
              macOS 10.15 이상<br />
              Intel 및 Apple Silicon 지원
            </p>
            
            {/* 메인 다운로드 버튼 */}
            <Button 
              className="bg-coupas-primary hover:bg-coupas-secondary text-white w-full mb-3"
              onClick={handleMacDownload}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              다운로드 {detectedMacType ? `(${detectedMacType === 'apple-silicon' ? 'M1/M2' : 'Intel'})` : ''}
            </Button>
            
            {/* 수동 선택 옵션 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMacOptions(!showMacOptions);
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 py-2"
              >
                다른 버전 선택
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showMacOptions ? 'rotate-180' : ''}`} />
              </button>
              
              {showMacOptions && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      downloadMacVersion('apple-silicon');
                      setShowMacOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
                  >
                    <div className="font-medium">Apple Silicon (M1/M2)</div>
                    <div className="text-gray-500 text-xs">ARM64 - coupas-mac-0.0.1-arm64.dmg</div>
                  </button>
                  <button
                    onClick={() => {
                      downloadMacVersion('intel');
                      setShowMacOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                  >
                    <div className="font-medium">Intel 프로세서</div>
                    <div className="text-gray-500 text-xs">x64 - coupas-mac-0.0.1-x64.dmg</div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center md:w-80">
            <div className="bg-coupas-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coupas-primary">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-coupas-dark">Windows 버전</h3>
            <p className="text-gray-600 mb-4">
              Windows 10 이상<br />
              64비트 운영체제 지원
            </p>
            <p className="text-xs text-gray-500 mb-6">
              📦 coupas-win-0.0.1-x64.exe (v0.0.1)
            </p>
            <Button 
              className="bg-coupas-primary hover:bg-coupas-secondary text-white w-full"
              onClick={handleWindowsDownload}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              다운로드 (64비트)
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
