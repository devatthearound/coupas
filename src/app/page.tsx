'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            쿠팡 파트너스 <span className="text-[#514FE4]">영상 생성기</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            쿠팡 상품을 검색하고 영상을 자동으로 생성하세요
          </p>
          
          <div className="max-w-3xl mx-auto mb-8 aspect-video">
            <iframe 
              className="w-full h-full rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/7RXVPu7CZRA?si=oHvdMsdHON_bzfLc" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>

          <button
            onClick={() => router.push('/search')}
            className="px-8 py-3 bg-[#514FE4] hover:bg-[#4140B3] text-white rounded-lg 
              transition-colors duration-200 font-medium"
          >
            ✨ 시작하기
          </button>
        </div>
      </div>
  );
}