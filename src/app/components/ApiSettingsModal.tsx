import { useState } from 'react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessKey: string;
  secretKey: string;
  onSave: (accessKey: string, secretKey: string) => void;
}

export default function ApiSettingsModal({ isOpen, onClose, accessKey, secretKey, onSave }: ApiSettingsModalProps) {
  const [tempAccessKey, setTempAccessKey] = useState(accessKey);
  const [tempSecretKey, setTempSecretKey] = useState(secretKey);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempAccessKey, tempSecretKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">API 설정</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Access Key</label>
              <input
                type="text"
                value={tempAccessKey}
                onChange={(e) => setTempAccessKey(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Secret Key</label>
              <input
                type="text"
                value={tempSecretKey}
                onChange={(e) => setTempSecretKey(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-[#514FE4] text-white rounded hover:bg-[#4140B3]"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 