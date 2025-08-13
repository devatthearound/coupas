import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface VideoPreviewModalProps {
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  onYoutubeUpload: (data: {
    title: string;
    description: string;
    tags: string[];
    thumbnailPath: string;
  }) => void;
  comments: string;
  commentTemplate: 'template1' | 'template2';
  onCommentTemplateChange: (template: 'template1' | 'template2') => void;
  onCommentsChange: (newComments: string) => void;
  keyword?: string; // 키워드 추가
}

export function VideoPreviewModal({
  videoTitle,
  isOpen,
  onClose,
  videoUrl,
  onYoutubeUpload,
  comments,
  commentTemplate,
  onCommentTemplateChange,
  onCommentsChange,
  keyword
}: VideoPreviewModalProps) {
  const router = useRouter();
  const [videoDataUrl, setVideoDataUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  
  // 업로드 완료 상태 관리
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && videoUrl) {
      // 모달이 열릴 때마다 상태 초기화
      setIsUploadComplete(false);
      setUploadedVideoId('');
      setIsUploading(false);
      
      // Electron의 preload API를 통해 파일을 읽어옴
      window.electron.readFileAsDataUrl(videoUrl)
        .then(dataUrl => {
          setVideoDataUrl(dataUrl);
        })
        .catch(error => {
          console.error('Error reading video file:', error);
          toast.error('비디오 파일을 불러오는데 실패했습니다.');
        });

      // 디폴트 썸네일 설정 (thumb_img.png)
      const defaultThumbnail = './thumb_img.png';
      setThumbnailPath(defaultThumbnail);

      // AI 제목 자동 생성
      if (keyword && !title) {
        generateAITitle();
      }
    }
  }, [isOpen, videoUrl, keyword]);

  const generateAITitle = async () => {
    if (!keyword) return;

    try {
      setIsGeneratingTitle(true);
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTitle(data.title);
        toast.success('AI 제목이 생성되었습니다!');
      } else {
        toast.error('제목 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('제목 생성 오류:', error);
      toast.error('제목 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const copyComments = () => {
    navigator.clipboard.writeText(comments);
    toast.success('댓글이 클립보드에 복사되었습니다!');
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      return toast.error('영상 제목을 입력해주세요.');
    }
    // 태그는 선택사항으로 변경
    if (!thumbnailPath) {
      return toast.error('썸네일 이미지를 선택해주세요.');
    }

    try {
      setIsUploading(true);
      
      // 인증 토큰 확인
      const authResponse = await fetch('/api/google-auth/token');
      if (!authResponse.ok) {
        toast.error('유튜브 로그인이 필요합니다.');
        if (window.electron) {
          window.electron.openExternal(`${window.location.origin}/google-auth`);
        } else {
          window.open(`${window.location.origin}/google-auth`, '_blank');
        }
        return;
      }

      const authData = await authResponse.json();
      
      // 토큰 형식 변환
      const authForElectron = {
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiryDate: authData.expires_at,
        tokenType: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };

      // Electron을 통한 업로드
      const uploadResult = await window.electron.uploadVideo(
        authForElectron,
        title,
        comments,
        tags.trim() ? tags.split(',').map(tag => tag.trim()) : [],
        videoUrl.replace('file://', ''),
        thumbnailPath
      );

      if (uploadResult.success) {
        // 업로드 성공 시 상태 업데이트
        setIsUploadComplete(true);
        setUploadedVideoId(uploadResult.videoId || '');
        toast.success('영상이 성공적으로 업로드되었습니다!');
        
        onYoutubeUpload({
          title,
          description: comments,
          tags: tags.trim() ? tags.split(',').map(tag => tag.trim()) : [],
          thumbnailPath
        });
      } else {
        toast.error('업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailSelect = async () => {
    try {
      const filePath = await window.electron.selectImageFile();
      if (filePath) {
        setThumbnailPath(filePath);
      }
    } catch (error) {
      console.error('썸네일 선택 중 오류:', error);
      toast.error('썸네일 선택에 실패했습니다.');
    }
  };

  const handleOpenLocalFolder = async () => {
    try {
      const videoDir = videoUrl.replace('file://', '').split('/').slice(0, -1).join('/');
      await window.electron.openFolder(videoDir);
    } catch (error) {
      console.error('폴더 열기 실패:', error);
      toast.error('폴더를 열 수 없습니다.');
    }
  };

  const handleCreateAnotherVideo = () => {
    onClose();
    router.push('/');
  };

  const handleOpenYoutubeVideo = () => {
    if (uploadedVideoId) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${uploadedVideoId}`;
      if (window.electron) {
        window.electron.openExternal(youtubeUrl);
      } else {
        window.open(youtubeUrl, '_blank');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">{videoTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">✕</button>
        </div>

        {/* Video Preview */}
        <div className="aspect-video bg-black">
          {videoDataUrl ? (
            <video src={videoDataUrl} controls className="w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              비디오 로딩 중...
            </div>
          )}
        </div>

        {/* 업로드 완료 후 표시할 내용 */}
        {isUploadComplete ? (
          <div className="p-6">
            {/* 성공 메시지 */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🎉 업로드 완료!</h2>
              <p className="text-gray-300">영상이 성공적으로 YouTube에 업로드되었습니다.</p>
            </div>

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* YouTube 링크 */}
              <button
                onClick={handleOpenYoutubeVideo}
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold">YouTube 보기</h3>
                    <p className="text-sm opacity-90">업로드된 영상 확인</p>
                  </div>
                </div>
              </button>

              {/* 로컬 저장소 */}
              <button
                onClick={handleOpenLocalFolder}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold">로컬 저장소</h3>
                    <p className="text-sm opacity-90">영상 파일 위치 열기</p>
                  </div>
                </div>
              </button>

              {/* 영상 만들기 */}
              <button
                onClick={handleCreateAnotherVideo}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold">영상 만들기</h3>
                    <p className="text-sm opacity-90">새로운 영상 제작</p>
                  </div>
                </div>
              </button>
            </div>

            {/* 업로드 정보 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">업로드 정보</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div><span className="font-medium">제목:</span> {title}</div>
                <div><span className="font-medium">업로드 시간:</span> {new Date().toLocaleString()}</div>
                {uploadedVideoId && (
                  <div><span className="font-medium">비디오 ID:</span> {uploadedVideoId}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Generated Comments */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">자동 생성된 댓글</h4>
                <div className="flex gap-2">
                  <button
                    onClick={copyComments}
                    className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    복사하기
                  </button>
                  <select
                    value={commentTemplate}
                    onChange={(e) => onCommentTemplateChange(e.target.value as 'template1' | 'template2')}
                    className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    <option value="template1">템플릿 1</option>
                    <option value="template2">템플릿 2</option>
                  </select>
                </div>
              </div>
              <textarea
                value={comments}
                onChange={(e) => onCommentsChange(e.target.value)}
                className="w-full h-48 bg-gray-800 text-gray-200 rounded-lg p-4 font-mono text-sm
                  border border-gray-700 focus:border-[#514FE4] focus:ring-1 focus:ring-[#514FE4]
                  resize-none"
              />
            </div>

            {/* Upload Settings */}
            <div className="p-4 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">업로드 설정</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-300">영상 제목</label>
                    <button
                      onClick={generateAITitle}
                      disabled={isGeneratingTitle || !keyword}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isGeneratingTitle ? '생성 중...' : '🤖 AI 제목 생성'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                    placeholder="영상 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    태그 (쉼표로 구분) 
                    <span className="text-xs text-gray-500 ml-1">- 선택사항</span>
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                    placeholder="태그1, 태그2, 태그3 (비워둬도 됩니다)"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    썸네일 이미지 
                    <span className="text-xs text-green-500 ml-1">- 디폴트 설정됨</span>
                  </label>
                  <button
                    onClick={handleThumbnailSelect}
                    className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 text-left"
                  >
                    {thumbnailPath ? (
                      thumbnailPath === './thumb_img.png' ? 
                        '📸 기본 썸네일 (thumb_img.png)' : 
                        thumbnailPath.split('/').pop()
                    ) : '썸네일 이미지 선택'}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-4">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isUploading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-500'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    업로드 중...
                  </div>
                ) : (
                  '🚀 유튜브 업로드'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 