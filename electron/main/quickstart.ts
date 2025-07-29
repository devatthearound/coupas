// Fixed YouTubeUploader class

import fs from 'fs';
import assert from 'assert';
import { google } from 'googleapis';
import { homedir } from 'os';

// video category IDs for YouTube:
const categoryIds = {
  Entertainment: 24,
  Education: 27,
  ScienceTechnology: 28
}

// If modifying these scopes, delete your previously saved credentials in client_oauth_token.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = 'client_oauth_token.json';

 // 결과값 인터페이스 정의
 interface UploadResult {
  videoData: {
    id: string;
    etag: string;
    kind: string;
    snippet: any;
    status: any;
  };
  thumbnailData?: any;
  thumbnailError?: string;
  thumbnailSkipped?: boolean;
}

interface UploadResponse {
  success: boolean;
  data?: UploadResult;
  error?: string;
  links?: {
    studioEditLink: string;
    videoLink: string;
    studioContentLink: string;
    apiUpdateEndpoint: string;
  };
}

export class YouTubeUploader {
  static async uploadVideo(auth: any, title: any, description: any, tags: any, videoFilePath: any, thumbFilePath: any) {
    // These should use the parameters passed in, not the global variables

    // Debugging logs
    console.log('🚀 === YouTube 업로드 시작 ===');
    console.log('📝 제목:', title);
    console.log('📋 설명:', description);
    console.log('🏷️ 태그:', tags);
    console.log('📹 비디오 파일 경로:', videoFilePath);
    console.log('🖼️ 썸네일 파일 경로:', thumbFilePath);
    console.log('🔑 인증 객체:', JSON.stringify(auth, null, 2));

    // Check if files exist
    try {
      console.log('🏠 홈 디렉터리:', homedir());
      console.log('📁 비디오 파일 존재 확인:', fs.existsSync(videoFilePath));
      console.log('📁 썸네일 파일 존재 확인:', thumbFilePath ? fs.existsSync(thumbFilePath) : '썸네일 없음');
      
      assert(fs.existsSync(videoFilePath), '비디오 파일이 존재하지 않습니다: ' + videoFilePath);
      
      // 썸네일은 선택사항으로 처리
      if (thumbFilePath && !fs.existsSync(thumbFilePath)) {
        console.warn('⚠️ 썸네일 파일이 존재하지 않습니다. 썸네일 없이 업로드합니다:', thumbFilePath);
        thumbFilePath = null; // 썸네일 없이 진행
      }
    } catch (error) {
      console.error('❌ 파일 존재 확인 실패:', (error as Error).message);
      console.error('📹 비디오 파일 경로:', videoFilePath);
      console.error('🖼️ 썸네일 파일 경로:', thumbFilePath);
      return { success: false, error: (error as Error).message };
    }

    // Authorize a client with the loaded credentials, then call the YouTube API.
    try {
      const result = await YouTubeUploader.performUpload(auth, title, description, tags, videoFilePath, thumbFilePath);
      
      // Generate helpful links for the uploaded video
      if (result.videoData && result.videoData.id) {
        const videoId = result.videoData.id;
        const links = YouTubeUploader.generateVideoLinks(videoId);
        return { success: true, data: result, links };
      }
      
      return { success: true, data: result };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

   /**
   * Generate helpful links for an uploaded YouTube video
   * 
   * @param {string} videoId The ID of the uploaded video
   * @returns {Object} Object containing useful links
   */
   static generateVideoLinks(videoId: string) {
    return {
      // Link to edit the video in YouTube Studio
      studioEditLink: `https://studio.youtube.com/video/${videoId}/edit`,
      
      // Direct link to the video (even when private)
      videoLink: `https://www.youtube.com/watch?v=${videoId}`,
      
      // Link to YouTube Studio content page
      studioContentLink: 'https://studio.youtube.com/channel/content',
      
      // API endpoint for updating the video's privacy status
      apiUpdateEndpoint: `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}`
    };
  }


  /**
   * Upload the video file.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  static performUpload(auth: any, title: any, description: any, tags: any, videoFilePath: any, thumbFilePath: any): Promise<UploadResult> {

    return new Promise((resolve, reject) => {
      // 인증 객체가 token 형태인 경우 OAuth2 클라이언트로 변환
      let authClient: any;
      
      try {
        // auth가 이미 OAuth2 클라이언트인지 확인
        if (auth.credentials) {
          // 이미 OAuth2 클라이언트임
          authClient = auth;
        } else if (auth.accessToken) {
          // 토큰 객체가 전달된 경우
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({
            access_token: auth.accessToken,
            refresh_token: auth.refreshToken,
            expiry_date: auth.expiryDate,
            token_type: auth.tokenType,
            scope: auth.scope
          });
          authClient = oauth2Client;
        } else {
          throw new Error('유효한 인증 정보가 없습니다.');
        }
                
        const service = google.youtube('v3');
    
        service.videos.insert({
          auth: authClient,
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title,
              description,
              tags,
              categoryId: categoryIds.ScienceTechnology.toString(),
              defaultLanguage: 'en',
              defaultAudioLanguage: 'en'
            },
            status: {
              privacyStatus: "private"
            },
          },
          media: {
            body: fs.createReadStream(videoFilePath),
          },
        }, function(err: any, response: any) {
          if (err) {
            reject(err);
            return;
          }
          console.log('✅ 비디오 업로드 성공! 비디오 ID:', response.data.id);
    
          // 썸네일이 있는 경우에만 업로드
          if (thumbFilePath) {
            console.log('🖼️ 썸네일 업로드 시작...');
            service.thumbnails.set({
              auth: authClient,
              videoId: response.data.id,
              media: {
                body: fs.createReadStream(thumbFilePath)
              },
            }, function(err: any, thumbResponse: any) {
              if (err) {
                console.log('❌ 썸네일 업로드 오류:', err);
                // 썸네일 실패해도 비디오 데이터는 반환
                resolve({ videoData: response.data, thumbnailError: err.message });
                return;
              }
              console.log('✅ 썸네일 업로드 성공!');
              resolve({ videoData: response.data, thumbnailData: thumbResponse.data });
            });
          } else {
            console.log('⏭️ 썸네일이 없어서 비디오만 업로드 완료');
            resolve({ videoData: response.data, thumbnailSkipped: true });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}