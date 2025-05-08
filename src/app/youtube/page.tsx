'use client';
// pages/index.js
import React, { useCallback, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 메인 컴포넌트를 별도로 분리
function YouTubeUploader() {
  const searchParams = useSearchParams();
  
  // 상품정보 JSON으로 사용자 입력 받기
  const [productInfo, setProductInfo] = useState<string>('');
  // 비디오 제목
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFilePath, setVideoFilePath] = useState<string | null>(null);
  const [thumbFilePath, setThumbFilePath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // URL 파라미터에서 비디오 경로 가져오기
  useEffect(() => {
    const videoPath = searchParams.get('videoPath');
    if (videoPath) {
      setVideoFilePath(decodeURIComponent(videoPath));
    }
  }, [searchParams]);

  const handleSelectVideo = async () => {
    try {
      const filePath = await window.electron.selectVideoFile();
      console.log('Selected video file:', filePath);
      if (filePath) {
        setVideoFilePath(filePath);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      setUploadStatus('Failed to select video file');
    }
  };
  
  const handleSelectThumbnail = async () => {
    try {
      const filePaths = await window.electron.selectImageFiles();
      console.log('Selected image files:', filePaths);
      if (filePaths && filePaths.length > 0) {
        setThumbFilePath(filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting thumbnail:', error);
      setUploadStatus('Failed to select thumbnail file');
    }
  };

  const handleUpload = useCallback(async () => {
    // Validate inputs
    if (!title.trim()) {
      setUploadStatus('Please enter a title');
      return;
    }
    
    if (!description.trim()) {
      setUploadStatus('Please enter a description');
      return;
    }

    if (!tags.trim()) {
      setUploadStatus('Please enter at least one tag');
      return;
    }
    
    if (!videoFilePath) {
      setUploadStatus('Please select a video file');
      return;
    }
    
    if (!thumbFilePath) {
      setUploadStatus('Please select a thumbnail image');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Authenticating with Google...');

    try {
      // Get Google auth token
      const response = await fetch('/api/google-auth/token');

      if (!response.ok) {
        throw new Error('Failed to get Google authentication token');
      }

      const authData = await response.json();
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      setUploadStatus('Uploading video to YouTube...');
      console.log('Starting upload with:', {
        auth: authData.data,
        title,
        description,
        tags: tagsArray,
        videoFilePath: videoFilePath,
        thumbFilePath: thumbFilePath
      });
      
      // Upload video
      const result = await window.electron.uploadVideo(
        authData.data, 
        title, 
        description, 
        tagsArray, 
        videoFilePath, 
        thumbFilePath
      );
      
      console.log('Upload result:', result);
      
      if (result.success) {
        setUploadStatus('Video uploaded successfully!');
      } else {
        setUploadStatus(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsUploading(false);
    }
  }, [title, description, tags, videoFilePath, thumbFilePath]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">YouTube Video Uploader</h1>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Title</label>
        <input
          type="text"
          placeholder="Enter video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isUploading}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Description</label>
        <textarea
          placeholder="Enter video description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md h-24"
          disabled={isUploading}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Tags (comma separated)</label>
        <input
          type="text"
          placeholder="tag1, tag2, tag3"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isUploading}
        />
      </div>
      
      <div className="mb-4">
        <button 
          onClick={handleSelectVideo}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mr-2"
          disabled={isUploading}
        >
          Select Video
        </button>
        {videoFilePath && (
          <p className="mt-2 text-sm truncate">Selected: {videoFilePath}</p>
        )}
      </div>
      
      <div className="mb-6">
        <button 
          onClick={handleSelectThumbnail}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          disabled={isUploading}
        >
          Select Thumbnail
        </button>
        {thumbFilePath && (
          <p className="mt-2 text-sm truncate">Selected: {thumbFilePath}</p>
        )}
      </div>
      
      {uploadStatus && (
        <div className={`mb-4 p-3 rounded-md ${uploadStatus.includes('failed') || uploadStatus.includes('Error') ? 'bg-red-100 text-red-700' : uploadStatus.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {uploadStatus}
        </div>
      )}
      
      <button 
        onClick={handleUpload}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload Video'}
      </button>
    </div>
  );
}

// 페이지 컴포넌트
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <YouTubeUploader />
    </Suspense>
  );
}