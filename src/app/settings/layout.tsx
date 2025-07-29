'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Cog6ToothIcon, 
  LinkIcon, 
  ShareIcon, 
  VideoCameraIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const menuItems = [
  {
    href: '/settings',
    label: 'API 연동 설정',
    description: '쿠팡, 알리익스프레스, 아마존 API',
    icon: LinkIcon,
    exact: true
  },
  {
    href: '/settings/sns',
    label: 'SNS 연동 설정',
    description: '유튜브, 스래드, 인스타그램, 페이스북',
    icon: ShareIcon,
    exact: false
  },
  {
    href: '/settings/video-templates',
    label: '영상 템플릿 설정',
    description: '인트로, 아웃트로, 배경음악, 저장경로',
    icon: VideoCameraIcon,
    exact: false
  }
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">설정</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              API 연동, SNS 연결, 영상 템플릿을 관리하세요
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            이전으로
          </button>
        </div>

        <div className="flex gap-8">
          {/* 좌측 사이드바 */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#514FE4] rounded-full flex items-center justify-center">
                    <Cog6ToothIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">설정 메뉴</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">원하는 설정을 선택하세요</p>
                  </div>
                </div>
              </div>

              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center justify-between p-3 rounded-lg mb-1 transition-all duration-200 group
                        ${active 
                          ? 'bg-[#514FE4] text-white shadow-md' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                        <div>
                          <div className={`font-medium ${active ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {item.label}
                          </div>
                          <div className={`text-xs ${active ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRightIcon 
                        className={`w-4 h-4 transition-transform ${
                          active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                        }`} 
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* 도움말 카드 */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">💡 설정 도움말</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                    각 설정을 완료하면 더 편리하게 서비스를 이용할 수 있습니다. 
                    설정은 언제든지 변경 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 콘텐츠 영역 */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 
