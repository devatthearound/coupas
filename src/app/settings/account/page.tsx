'use client';

import { useEffect, useState } from 'react';

export default function AccountSettingsPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setEmail(data.user.email || '');
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/user/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        newPassword,
        currentPassword,
      }),
    });
    const data = await res.json();
    setLoading(false);
    alert(data.message);
  };

  const handleDelete = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        // 로그아웃 후 홈페이지로 리다이렉트
        window.location.href = '/';
      } else {
        alert(data.message || '계정 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">계정</h3>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full" />
      </div>
      <button onClick={handleSave} disabled={loading}
        className="px-6 py-2 bg-[#514FE4] text-white rounded-lg font-medium hover:bg-[#413fc0] mr-4">
        {loading ? '저장 중...' : '계정 저장'}
      </button>
      <button onClick={handleDelete} disabled={loading}
        className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
        계정 삭제
      </button>
    </div>
  );
}