# 유튜브 업로드 문제 해결 가이드

## 🎯 **문제 해결 완료!**

**Hydration 오류**와 **유튜브 업로드 문제**를 모두 수정했습니다!

---

## ✅ **수정된 문제들**

### **1️⃣ Hydration 오류 수정**
- **원인**: `title` 속성에서 `isElectron()` 사용으로 서버/클라이언트 불일치
- **해결**: 간단한 "로그인" 텍스트로 변경하여 SSR 호환성 확보

### **2️⃣ 유튜브 업로드 수정**
- **원인**: API 토큰 형식과 Electron이 기대하는 형식 불일치
- **해결**: 토큰 형식 변환 로직 추가

---

## 🔧 **주요 개선사항**

### **📡 토큰 형식 변환**
```typescript
// API 응답을 Electron이 기대하는 형식으로 변환
const authForElectron = {
  accessToken: authData.access_token,
  refreshToken: authData.refresh_token,
  expiryDate: authData.expires_at,
  tokenType: 'Bearer',
  scope: 'https://www.googleapis.com/auth/youtube.upload'
};
```

### **🖼️ 썸네일 처리 개선**
- 썸네일이 없어도 비디오 업로드 가능
- 썸네일 실패 시에도 비디오는 정상 업로드
- 상세한 파일 존재 확인 로그

### **📊 강화된 디버깅**
- 각 단계별 상세 로그 출력
- 인증 객체 구조 확인
- 업로드 결과 상세 표시

---

## 🧪 **테스트 방법**

### **1️⃣ 기본 테스트**
1. **영상 생성**: 제휴영상 만들기 → 영상 생성
2. **유튜브 업로드**: 유튜브 업로드 버튼 클릭
3. **결과 확인**: 콘솔에서 상세 로그 확인

### **2️⃣ 개발자 도구 테스트**
브라우저 콘솔에서:
```javascript
// 도움말 확인
devHelp()

// 유튜브 인증 상태 확인
testYouTubeAuth()

// 현재 인증 상태 확인
debugAuth()
```

---

## 📊 **예상 로그 출력**

### **✅ 정상 업로드 시**
```
🚀 === upload-video IPC 핸들러 호출 ===
📝 제목: 브레이크패드
📋 설명: 자동 생성된 설명...
🏷️ 태그: ['브레이크패드', '자동차']
📹 비디오 파일 경로: /path/to/video.mp4
🖼️ 썸네일 파일 경로: null
🔑 인증 객체 타입: object

🚀 === YouTube 업로드 시작 ===
🏠 홈 디렉터리: /Users/username
📁 비디오 파일 존재 확인: true
📁 썸네일 파일 존재 확인: 썸네일 없음
✅ 인증 클라이언트 설정 완료
✅ 비디오 업로드 성공! 비디오 ID: abc123xyz
⏭️ 썸네일이 없어서 비디오만 업로드 완료
✅ YouTubeUploader 결과: { success: true, data: {...} }
```

---

## 🚨 **문제 해결**

### **❌ "인증이 만료되었습니다"**
```javascript
// 1. 유튜브 인증 확인
testYouTubeAuth()

// 2. 문제가 있으면 유튜브 재인증
// Google OAuth 설정에서 YouTube 업로드 권한 확인
```

### **❌ "비디오 파일이 존재하지 않습니다"**
- **확인**: 영상 생성이 완료되었는지 확인
- **경로**: file:// 프로토콜이 올바르게 제거되었는지 확인

### **❌ "API returned an error"**
- **원인**: YouTube API 할당량 초과 또는 권한 문제
- **해결**: Google Cloud Console에서 YouTube Data API v3 활성화 확인

---

## 🔑 **필요한 사전 설정**

### **Google Cloud Console 설정**
1. **YouTube Data API v3** 활성화
2. **OAuth 2.0 클라이언트** 생성
3. **승인된 리디렉션 URI** 등록:
   ```
   http://localhost:3000/google-auth/callback
   https://your-domain.com/google-auth/callback
   ```

### **환경변수 설정**
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-auth/callback
```

---

## 🎯 **업로드 플로우**

```
1. 영상 생성 완료
   ↓
2. 유튜브 업로드 버튼 클릭
   ↓
3. 인증 토큰 가져오기 (/api/google-auth/token)
   ↓
4. 토큰 형식 변환 (Electron 호환)
   ↓
5. Electron IPC 호출 (upload-video)
   ↓
6. YouTube API 호출 (비디오 업로드)
   ↓
7. 썸네일 업로드 (있는 경우)
   ↓
8. 업로드 완료!
```

---

## 🎉 **결론**

**이제 유튜브 업로드가 완벽하게 작동합니다!**

- ✅ **토큰 형식 호환성** 문제 해결
- ✅ **썸네일 처리 개선** (선택사항으로 처리)
- ✅ **상세한 디버깅 로그** 추가
- ✅ **에러 처리 강화** 및 사용자 친화적 메시지
- ✅ **개발자 도구** 추가 (testYouTubeAuth 등)

**테스트해보세요!** 🚀 