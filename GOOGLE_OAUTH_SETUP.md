# Google OAuth 설정 가이드

## 🔧 Google Cloud Console 설정

### 1. Google Cloud Console 접속
- [Google Cloud Console](https://console.cloud.google.com/) 접속
- 프로젝트 선택

### 2. OAuth 2.0 클라이언트 ID 설정
1. **API 및 서비스** → **사용자 인증 정보** 클릭
2. **OAuth 2.0 클라이언트 ID** 목록에서 기존 클라이언트 ID를 찾아 클릭하거나 새로 생성

### 3. 승인된 리디렉션 URI 추가
**승인된 리디렉션 URI** 섹션에서 다음 URI들을 추가:

```
http://localhost:3000/google-auth/callback
http://localhost:3001/google-auth/callback
http://localhost:3002/google-auth/callback
```

### 4. 저장
- **저장** 버튼 클릭
- 변경사항이 적용되기까지 몇 분 정도 소요될 수 있습니다.

## 🧪 테스트 방법

### 1. 브라우저에서 테스트
1. `http://localhost:3000` 접속
2. **YouTube** 메뉴 클릭
3. **유튜브 연동** 버튼 클릭
4. Google 로그인 페이지로 리디렉트됨
5. 로그인 후 자동으로 앱으로 돌아옴

### 2. Electron에서 테스트
1. Electron 앱에서 **YouTube** 메뉴 클릭
2. **유튜브 연동** 버튼 클릭
3. 외부 브라우저에서 Google 로그인
4. 앱으로 자동 돌아오기

## 🔍 문제 해결

### 리디렉션 URI 오류
```
Error: redirect_uri_mismatch
```
- Google Cloud Console에서 리디렉션 URI가 정확히 등록되었는지 확인
- URI 끝에 슬래시(/)가 없는지 확인

### 인증 코드 교환 실패
```
Error: invalid_grant
```
- 인증 코드는 한 번만 사용 가능
- 새로운 인증을 시도

### API 키 누락
```
Error: Google OAuth 설정이 누락되었습니다
```
- `.env.local` 파일에서 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 확인

## 📝 환경변수 설정

`.env.local` 파일에 다음 설정을 추가하세요:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/google-auth/callback
```

**⚠️ 보안 주의사항:**
- 실제 Client ID와 Client Secret은 절대 Git에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
- 프로덕션 환경에서는 환경변수로 관리하세요

## 🚀 완료 후

Google OAuth 설정이 완료되면:
1. YouTube 동영상 업로드 기능 사용 가능
2. YouTube API를 통한 채널 정보 조회 가능
3. 자동 리프레시 토큰 갱신
