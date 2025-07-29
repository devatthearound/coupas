import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

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
  const [videoDataUrl, setVideoDataUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  useEffect(() => {
    if (isOpen && videoUrl) {
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

  const handleUpload = () => {
    if (!title.trim()) {
      return toast.error('영상 제목을 입력해주세요.');
    }
    // 태그는 선택사항으로 변경
    if (!thumbnailPath) {
      return toast.error('썸네일 이미지를 선택해주세요.');
    }

    onYoutubeUpload({
      title,
      description: comments,
      tags: tags.trim() ? tags.split(',').map(tag => tag.trim()) : [], // 빈 배열 허용
      thumbnailPath
    });
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
        {/* <div className="p-4 border-t border-gray-700">
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
        </div> */}

        {/* Action Buttons */}
        {/* <div className="p-4 border-t border-gray-700 flex justify-end gap-4">
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            유튜브 업로드
          </button>
        </div> */}
      </div>
    </div>
  );
} 