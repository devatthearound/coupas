// src/app/components/TemplateModal.tsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { VideoTemplate, templateService } from '@/services/templates/api';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    templateName?: string;
    introVideo: string | null;
    outroVideo: string | null;
    backgroundMusic: string | null;
    outputDirectory: string | null;
    imageDisplayDuration: number;
  };
  onLoadTemplate: (template: VideoTemplate) => void;
  onSaveTemplate: (templateName: string, isDefault: boolean) => void;
}

export default function TemplateModal({
  isOpen,
  onClose,
  currentSettings,
  onLoadTemplate,
  onSaveTemplate
}: TemplateModalProps) {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [activeTab, setActiveTab] = useState<'load' | 'save'>('load');

  // 템플릿 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setNewTemplateName(currentSettings.templateName || '');
    }
  }, [isOpen, currentSettings]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templateList = await templateService.getTemplates();
      setTemplates(templateList);
      
      // 현재 설정과 일치하는 템플릿 자동 선택
      const matchingTemplate = templateList.find(
        template => 
          template.intro_video_path === currentSettings.introVideo &&
          template.outro_video_path === currentSettings.outroVideo &&
          template.background_music_path === currentSettings.backgroundMusic &&
          template.output_directory === currentSettings.outputDirectory &&
          template.image_display_duration === currentSettings.imageDisplayDuration
      );
      
      if (matchingTemplate) {
        setSelectedTemplateId(matchingTemplate.id || null);
      } else {
        setSelectedTemplateId(null);
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      toast.error('템플릿을 로드하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error('템플릿을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const template = await templateService.getTemplate(selectedTemplateId);
      if (template) {
        // 템플릿 사용 기록 업데이트
        await templateService.updateTemplateUsage(selectedTemplateId);
        onLoadTemplate(template);
        toast.success('템플릿을 성공적으로 불러왔습니다.');
        onClose();
      } else {
        toast.error('템플릿을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      toast.error('템플릿을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('템플릿 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      onSaveTemplate(newTemplateName.trim(), makeDefault);
      toast.success('템플릿이 저장되었습니다.');
      onClose();
      
      // 템플릿 목록 갱신
      loadTemplates();
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      toast.error('템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await templateService.deleteTemplate(id);
      if (success) {
        toast.success('템플릿이 삭제되었습니다.');
        loadTemplates();
        if (selectedTemplateId === id) {
          setSelectedTemplateId(null);
        }
      } else {
        toast.error('템플릿 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      toast.error('템플릿 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            비디오 템플릿 관리
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-3 px-4 ${
              activeTab === 'load'
                ? 'text-[#514FE4] dark:text-[#6C63FF] border-b-2 border-[#514FE4] dark:border-[#6C63FF] font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('load')}
          >
            템플릿 불러오기
          </button>
          <button
            className={`py-3 px-4 ${
              activeTab === 'save'
                ? 'text-[#514FE4] dark:text-[#6C63FF] border-b-2 border-[#514FE4] dark:border-[#6C63FF] font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('save')}
          >
            현재 설정 저장
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'load' ? (
            // 템플릿 불러오기 탭
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  {isLoading ? '템플릿 로딩 중...' : '저장된 템플릿이 없습니다.'}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id || null)}
                      className={`p-3 border mb-2 rounded-lg cursor-pointer flex justify-between items-center 
                        ${selectedTemplateId === template.id 
                          ? 'border-[#514FE4] dark:border-[#6C63FF] bg-[#514FE4]/5 dark:bg-[#6C63FF]/5' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {template.template_name}
                          {template.is_default && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-400 text-xs rounded">
                              기본
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          마지막 사용: {new Date(template.last_used_at || template.created_at || '').toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteTemplate(template.id || 0, e)}
                        className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        title="삭제"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={handleLoadTemplate}
                  disabled={isLoading || !selectedTemplateId}
                  className={`px-4 py-2 rounded-lg ${
                    isLoading || !selectedTemplateId
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] text-white'
                  }`}
                >
                  {isLoading ? '로딩 중...' : '템플릿 불러오기'}
                </button>
              </div>
            </div>
          ) : (
            // 템플릿 저장 탭
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="템플릿 이름을 입력하세요"
                  className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 
                    rounded-lg focus:outline-none focus:ring-2 focus:ring-[#514FE4] dark:focus:ring-[#6C63FF] bg-white dark:bg-gray-700"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="make-default"
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="h-4 w-4 text-[#514FE4] dark:text-[#6C63FF] focus:ring-[#514FE4] dark:focus:ring-[#6C63FF] 
                    border-gray-300 dark:border-gray-600 rounded"
                />
                <label
                  htmlFor="make-default"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  기본 템플릿으로 설정
                </label>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={handleSaveTemplate}
                  disabled={isLoading || !newTemplateName.trim()}
                  className={`px-4 py-2 rounded-lg ${
                    isLoading || !newTemplateName.trim()
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] text-white'
                  }`}
                >
                  {isLoading ? '저장 중...' : '템플릿 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}