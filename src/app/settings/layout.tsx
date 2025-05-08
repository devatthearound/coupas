// src/app/settings/layout.tsx
'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menu = [
  { label: '프로필', href: '/settings' },
  { label: '계정', href: '/settings/account' },
  { label: '쿠팡 연동 관리', href: '/settings/coupang' },
//   { label: '유투브 연동 관리', href: '/settings/youtube' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f7fb] py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg flex overflow-hidden">
        {/* 왼쪽 메뉴 */}
        <aside className="w-64 border-r border-gray-100 bg-white py-10 px-8">
          <h2 className="text-2xl font-bold mb-8">계정</h2>
          <nav className="flex flex-col gap-2">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-left px-4 py-2 rounded-lg font-medium transition
                  ${pathname === item.href
                    ? 'bg-gray-100 text-[#514FE4]'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        {/* 오른쪽 컨텐츠 */}
        <section className="flex-1 p-10">{children}</section>
      </div>
    </div>
  );
}