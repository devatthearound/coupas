import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { saveCoupangApiKeys, getCoupangApiKeys } from '@/services/coupang/keys';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = async () => {
    try {
      const keys = await getCoupangApiKeys();
      if (keys) {
        setAccessKey(keys.accessKey);
        setSecretKey(keys.secretKey);
      } else {
        setAccessKey('');
        setSecretKey('');
      }
    } catch (error) {
      toast.error('API 키 로드 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!accessKey || !secretKey) {
      toast.error('Access Key와 Secret Key를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await saveCoupangApiKeys({ accessKey, secretKey });
      toast.success('API 키가 저장되었습니다.');
      onClose();
    } catch (error) {
      toast.error('API 키 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">API 설정</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Access Key
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg
                  text-gray-200 placeholder-gray-500"
                placeholder="Access Key를 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg
                  text-gray-200 placeholder-gray-500"
                placeholder="Secret Key를 입력하세요"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-300 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3] 
              disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
} 