'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function VideoTemplatesPage() {
  const router = useRouter();
  
  // 영상 설정 상태들
  const [videoSettings, setVideoSettings] = useState({
    introVideo: '',
    outroVideo: '',
    backgroundMusic: '',
    imageDisplayDuration: 3,
    outputDirectory: ''
  });

  // 템플릿 관련 상태들
  const [templates, setTemplates] = useState<Array<{
    id: string;
    name: string;
    introVideo: string;
    outroVideo: string;
    backgroundMusic: string;
    imageDisplayDuration: number;
    outputDirectory: string;
    createdAt: string;
  }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // 템플릿 완성 여부 체크
  const isTemplateComplete = Boolean(
    videoSettings.introVideo && 
    videoSettings.outroVideo && 
    videoSettings.backgroundMusic && 
    videoSettings.outputDirectory
  );

  // 영상 만들러 가기 함수
  const goToVideoCreation = () => {
    if (!isTemplateComplete) {
      toast.error('모든 템플릿 설정을 완료해주세요.');
      return;
    }
    
    // 성공 메시지와 함께 이동
    toast.success('템플릿 설정이 완료되었습니다! 상품 검색 페이지로 이동합니다.');
    
    // 검색 페이지로 이동
    setTimeout(() => {
      router.push('/search');
    }, 1000);
  };

  // 템플릿 관련 함수들
  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/video-settings');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        console.error('템플릿 로드 실패:', data.error);
        toast.error('템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 로드 중 오류:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    }
  }, []);

  const saveTemplate = useCallback(async () => {
    console.log('템플릿 저장 시작:', { templateName, videoSettings });
    
    if (!templateName.trim()) {
      toast.error('템플릿 이름을 입력해주세요.');
      return;
    }

    if (!videoSettings.introVideo || !videoSettings.outroVideo || !videoSettings.backgroundMusic || !videoSettings.outputDirectory) {
      console.log('설정 누락:', {
        introVideo: videoSettings.introVideo,
        outroVideo: videoSettings.outroVideo,
        backgroundMusic: videoSettings.backgroundMusic,
        outputDirectory: videoSettings.outputDirectory
      });
      toast.error('모든 영상 설정을 완료해주세요.');
      return;
    }

    try {
      const templateData = {
        name: templateName.trim(),
        introVideo: videoSettings.introVideo,
        outroVideo: videoSettings.outroVideo,
        backgroundMusic: videoSettings.backgroundMusic,
        imageDisplayDuration: videoSettings.imageDisplayDuration,
        outputDirectory: videoSettings.outputDirectory
      };

      console.log('API 요청 데이터:', templateData);

      const response = await fetch('/api/video-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      console.log('API 응답 상태:', response.status);
      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data.success) {
        await loadTemplates();
        setTemplateName('');
        setIsTemplateModalOpen(false);
        toast.success('템플릿이 저장되었습니다!');
      } else {
        console.error('API 오류:', data.error);
        toast.error(data.error || '템플릿 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      toast.error('템플릿 저장에 실패했습니다.');
    }
  }, [templateName, videoSettings, loadTemplates]);

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/video-settings/${templateId}`);
      const data = await response.json();

      if (data.success) {
        const template = data.data;
        setVideoSettings({
          introVideo: template.introVideo,
          outroVideo: template.outroVideo,
          backgroundMusic: template.backgroundMusic,
          imageDisplayDuration: template.imageDisplayDuration,
          outputDirectory: template.outputDirectory
        });
        setSelectedTemplate(templateId);
        toast.success(`"${template.name}" 템플릿이 적용되었습니다!`);
      } else {
        toast.error(data.error || '템플릿을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      toast.error('템플릿 적용에 실패했습니다.');
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/video-settings/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates();
        
        if (selectedTemplate === templateId) {
          setSelectedTemplate('');
        }
        
        toast.success('템플릿이 삭제되었습니다.');
      } else {
        toast.error(data.error || '템플릿 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      toast.error('템플릿 삭제에 실패했습니다.');
    }
  }, [templates, selectedTemplate, loadTemplates]);

  // 파일 선택 핸들러들
  const handleIntroVideoChange = async () => {
    try {
      const filePath = await window.electron.selectVideoFile();
      if (filePath) {
        setVideoSettings(prev => ({ ...prev, introVideo: filePath }));
      }
    } catch (error) {
      console.error('인트로 영상 선택 중 오류:', error);
      toast.error('인트로 영상 선택에 실패했습니다.');
    }
  };

  const handleOutroVideoChange = async () => {
    try {
      const filePath = await window.electron.selectVideoFile();
      if (filePath) {
        setVideoSettings(prev => ({ ...prev, outroVideo: filePath }));
      }
    } catch (error) {
      console.error('아웃트로 영상 선택 중 오류:', error);
      toast.error('아웃트로 영상 선택에 실패했습니다.');
    }
  };

  const handleBackgroundMusicChange = async () => {
    try {
      const filePath = await window.electron.selectAudioFile();
      if (filePath) {
        setVideoSettings(prev => ({ ...prev, backgroundMusic: filePath }));
      }
    } catch (error) {
      console.error('배경 음악 선택 중 오류:', error);
      toast.error('배경 음악 선택에 실패했습니다.');
    }
  };

  const handleOutputDirectoryChange = async () => {
    try {
      const directoryPath = await window.electron.selectDirectory();
      if (directoryPath) {
        setVideoSettings(prev => ({ ...prev, outputDirectory: directoryPath }));
      }
    } catch (error) {
      console.error('저장 경로 선택 중 오류:', error);
      toast.error('저장 경로 선택에 실패했습니다.');
    }
  };

  // 현재 설정 초기화
  const resetSettings = () => {
    setVideoSettings({
      introVideo: '',
      outroVideo: '',
      backgroundMusic: '',
      imageDisplayDuration: 3,
      outputDirectory: ''
    });
    setSelectedTemplate('');
    toast.success('설정이 초기화되었습니다.');
  };

  // 컴포넌트 마운트 시 템플릿 로드
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">영상 템플릿 설정</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">반복 사용할 인트로, 아웃트로, 배경음악을 템플릿으로 저장하세요</p>
            </div>
          </div>

          {/* 템플릿 관리 섹션 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">저장된 템플릿</h3>
              <div className="flex gap-2">
                <button
                  onClick={resetSettings}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  초기화
                </button>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                >
                  현재 설정 저장
                </button>
              </div>
            </div>
            
            {templates.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={selectedTemplate}
                  onChange={(e) => e.target.value ? loadTemplate(e.target.value) : setSelectedTemplate('')}
                  className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                    border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3"
                >
                  <option value="">템플릿 선택해서 불러오기</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <button
                    onClick={() => deleteTemplate(selectedTemplate)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    삭제
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                💡 아래 설정을 완료한 후 &quot;현재 설정 저장&quot; 버튼으로 템플릿을 저장하세요.
              </p>
            )}
            
            {selectedTemplate && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded mt-2">
                ✓ 『{templates.find(t => t.id === selectedTemplate)?.name}』 템플릿 적용됨
              </div>
            )}
          </div>

          {/* 영상 설정 폼 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 인트로 영상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                인트로 영상
              </label>
              <button
                onClick={handleIntroVideoChange}
                className="w-full text-left text-sm text-gray-500 dark:text-gray-400
                  border border-gray-200 dark:border-gray-700 rounded-md
                  py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="inline-block mr-4 py-1 px-3
                  rounded-full border-0
                  text-xs font-semibold
                  bg-purple-100 text-purple-700
                  dark:bg-purple-900/20 dark:text-purple-300">
                  파일 선택
                </span>
                {videoSettings.introVideo ? videoSettings.introVideo.split('/').pop() : '인트로 영상을 선택하세요'}
              </button>
            </div>

            {/* 아웃트로 영상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                아웃트로 영상
              </label>
              <button
                onClick={handleOutroVideoChange}
                className="w-full text-left text-sm text-gray-500 dark:text-gray-400
                  border border-gray-200 dark:border-gray-700 rounded-md
                  py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="inline-block mr-4 py-1 px-3
                  rounded-full border-0
                  text-xs font-semibold
                  bg-purple-100 text-purple-700
                  dark:bg-purple-900/20 dark:text-purple-300">
                  파일 선택
                </span>
                {videoSettings.outroVideo ? videoSettings.outroVideo.split('/').pop() : '아웃트로 영상을 선택하세요'}
              </button>
            </div>

            {/* 배경 음악 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                배경 음악
              </label>
              <button
                onClick={handleBackgroundMusicChange}
                className="w-full text-left text-sm text-gray-500 dark:text-gray-400
                  border border-gray-200 dark:border-gray-700 rounded-md
                  py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="inline-block mr-4 py-1 px-3
                  rounded-full border-0
                  text-xs font-semibold
                  bg-purple-100 text-purple-700
                  dark:bg-purple-900/20 dark:text-purple-300">
                  파일 선택
                </span>
                {videoSettings.backgroundMusic ? videoSettings.backgroundMusic.split('/').pop() : '배경 음악을 선택하세요'}
              </button>
            </div>

            {/* 저장 경로 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                저장 경로
              </label>
              <button
                onClick={handleOutputDirectoryChange}
                className="w-full text-left text-sm text-gray-500 dark:text-gray-400
                  border border-gray-200 dark:border-gray-700 rounded-md
                  py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="inline-block mr-4 py-1 px-3
                  rounded-full border-0
                  text-xs font-semibold
                  bg-purple-100 text-purple-700
                  dark:bg-purple-900/20 dark:text-purple-300">
                  폴더 선택
                </span>
                {videoSettings.outputDirectory ? videoSettings.outputDirectory : '영상이 저장될 폴더를 선택하세요'}
              </button>
            </div>
          </div>

          {/* 이미지 표시 시간 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              상품 이미지 표시 시간 (초)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={videoSettings.imageDisplayDuration}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, imageDisplayDuration: Number(e.target.value) }))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                {videoSettings.imageDisplayDuration}초
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              제휴영상에서 각 상품이 화면에 표시되는 시간입니다
            </p>
          </div>

          {/* 현재 설정 상태 표시 */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">현재 설정 상태</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${videoSettings.introVideo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">인트로 영상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${videoSettings.outroVideo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">아웃트로 영상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${videoSettings.backgroundMusic ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">배경 음악</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${videoSettings.outputDirectory ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">저장 경로</span>
              </div>
            </div>
            
                         {/* 완성도 표시 */}
             <div className="mt-4">
               <div className="flex items-center justify-between text-sm mb-1">
                 <span className="text-gray-600 dark:text-gray-400">템플릿 완성도</span>
                 <span className="text-gray-600 dark:text-gray-400">
                   {[videoSettings.introVideo, videoSettings.outroVideo, videoSettings.backgroundMusic, videoSettings.outputDirectory].filter(Boolean).length}/4
                 </span>
               </div>
               <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                 <div 
                   className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                   style={{ 
                     width: `${([videoSettings.introVideo, videoSettings.outroVideo, videoSettings.backgroundMusic, videoSettings.outputDirectory].filter(Boolean).length / 4) * 100}%` 
                   }}
                 ></div>
               </div>
             </div>
           </div>

          {/* 영상 만들기 버튼 */}
          {isTemplateComplete && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">템플릿 설정 완료!</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">이제 이 템플릿을 사용해서 영상을 만들 수 있습니다.</p>
                  </div>
                </div>
                
                <button
                  onClick={goToVideoCreation}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg 
                    hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium
                    flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  이 템플릿으로 영상 만들기
                </button>
              </div>
            </div>
          )}

                     {/* 도움말 섹션 */}
           <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
             <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 템플릿 사용 가이드</h3>
             <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
               <p>• <strong>템플릿 저장:</strong> 모든 설정을 완료한 후 &quot;현재 설정 저장&quot; 버튼으로 템플릿을 저장하세요</p>
               <p>• <strong>바로 영상 만들기:</strong> 4가지 설정(인트로/아웃트로/배경음악/저장경로)이 완료되면 초록색 &quot;이 템플릿으로 영상 만들기&quot; 버튼이 나타납니다</p>
               <p>• <strong>템플릿 재사용:</strong> 저장된 템플릿을 선택해서 설정을 빠르게 불러올 수 있어요</p>
               <p>• <strong>인트로/아웃트로:</strong> 브랜드 로고나 채널 소개 영상을 설정하면 모든 영상에 자동 적용됩니다</p>
               <p>• <strong>배경음악:</strong> 상품 소개 구간에서 재생될 음악을 미리 설정해두세요</p>
               <p>• <strong>저장 경로:</strong> 완성된 영상들이 저장될 폴더를 지정해두면 편리합니다</p>
             </div>
           </div>
        </div>
      </div>

      {/* 템플릿 저장 모달 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">템플릿 저장</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    템플릿 이름
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveTemplate();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="예: 유튜브용 기본 설정"
                    autoFocus
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">저장될 설정:</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 인트로 영상: {videoSettings.introVideo ? '✓ 선택됨' : '✗ 미선택'}</li>
                    <li>• 아웃트로 영상: {videoSettings.outroVideo ? '✓ 선택됨' : '✗ 미선택'}</li>
                    <li>• 배경 음악: {videoSettings.backgroundMusic ? '✓ 선택됨' : '✗ 미선택'}</li>
                    <li>• 이미지 표시 시간: {videoSettings.imageDisplayDuration}초</li>
                    <li>• 저장 경로: {videoSettings.outputDirectory ? '✓ 선택됨' : '✗ 미선택'}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setTemplateName('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!templateName.trim()) {
                    toast.error('템플릿 이름을 입력해주세요.');
                    return;
                  }
                  saveTemplate();
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 