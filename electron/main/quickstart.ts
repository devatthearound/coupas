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

    // Check if files exist
    try {
      assert(fs.existsSync(videoFilePath), '비디오 파일이 존재하지 않습니다: ' + videoFilePath);
      assert(fs.existsSync(thumbFilePath), '썸네일 파일이 존재하지 않습니다: ' + thumbFilePath);
    } catch (error) {
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
    
          // Upload thumbnail
          service.thumbnails.set({
            auth: authClient,
            videoId: response.data.id,
            media: {
              body: fs.createReadStream(thumbFilePath)
            },
          }, function(err: any, thumbResponse: any) {
            if (err) {
              // Still resolve with the video data even if thumbnail fails
              resolve({ videoData: response.data, thumbnailError: err.message });
              return;
            }
            resolve({ videoData: response.data, thumbnailData: thumbResponse.data });
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}