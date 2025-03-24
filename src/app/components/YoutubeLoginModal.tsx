import { useState } from 'react';

interface YoutubeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { clientId: string; clientSecret: string }) => void;
}

export default function YoutubeLoginModal({ isOpen, onClose, onLogin }: YoutubeLoginModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ clientId, clientSecret });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">유튜브 API 설정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">✕</button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500"
                placeholder="YouTube API Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500"
                placeholder="YouTube API Client Secret"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3]"
          >
            연동하기
          </button>
        </div>
      </div>
    </div>
  );
} 