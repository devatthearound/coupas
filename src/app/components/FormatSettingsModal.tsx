import { useState } from 'react';

interface FormatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formatTemplate: string;
  onSave: (template: string) => void;
}

export default function FormatSettingsModal({ isOpen, onClose, formatTemplate, onSave }: FormatSettingsModalProps) {
  const [tempTemplate, setTempTemplate] = useState(formatTemplate);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">출력 형식 설정</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <textarea
              value={tempTemplate}
              onChange={(e) => setTempTemplate(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500"
              rows={4}
              placeholder="출력 형식을 입력하세요"
            />
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