'use client';

import { useEffect, useState } from 'react';

export default function ProfileSettingsPage() {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);

  // 유저 정보 불러오기
  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUsername(data.user.name || '');
          setPhone(data.user.phone_number || '');
          setCompany(data.user.company_name || '');
          setPosition(data.user.position || '');
        }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: username,
        phone_number: phone,
        company_name: company,
        position,
      }),
    });
    const data = await res.json();
    setLoading(false);
    alert(data.message);
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">프로필</h3>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
        <input type="text" value={company} onChange={e => setCompany(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
        <input type="text" value={position} onChange={e => setPosition(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <button onClick={handleSave} disabled={loading}
        className="px-6 py-2 bg-[#514FE4] text-white rounded-lg font-medium hover:bg-[#413fc0]">
        {loading ? '저장 중...' : '프로필 저장'}
      </button>
    </div>
  );
}