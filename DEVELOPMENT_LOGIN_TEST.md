# 개발환경 Growsome 로그인 연동 테스트 가이드

## 🚀 테스트 환경 설정 완료!

개발환경에서도 **실제 Growsome 로그인 연동**을 테스트할 수 있도록 설정이 완료되었습니다!

---

## 📋 변경된 개발환경 로그인 플로우

### **🔧 이전 (개발용 토큰 자동 사용)**:
```
로그인 버튼 클릭 → 개발용 토큰 자동 설정 → 바로 로그인 완료
```

### **🌟 현재 (실제 로그인 연동 테스트)**:
```
로그인 버튼 클릭 → Growsome으로 리다이렉트 → 로그인 → 앱으로 자동 돌아오기 → 로그인 완료
```

---

## 🛠️ 필수 설정 (Growsome 측)

### **1️⃣ 리다이렉트 URL 등록**:
Growsome 관리자 패널에서 다음 URL을 허용된 리다이렉트 URL로 등록:
```
http://localhost:3000/google-auth/callback
```

---

## 🧪 테스트 절차

### **1️⃣ 앱 시작**:
```bash
npm run dev
```

### **2️⃣ 브라우저에서 테스트**:
1. **`http://localhost:3000`** 접속
2. **로그인 버튼 클릭**
3. **자동으로 Growsome으로 리다이렉트됨**
4. **Growsome에서 로그인**
5. **자동으로 앱으로 돌아옴**
6. **로그인 완료!** ✅

### **3️⃣ Electron에서 테스트**:
1. **터미널에서 `npm run electron:dev`**
2. **Electron 앱에서 로그인 버튼 클릭**
3. **외부 브라우저에서 Growsome 로그인**
4. **앱으로 자동 돌아오기**
5. **로그인 완료!** ✅

---

## 🔧 개발자 도구 (필요시 사용)

### **빠른 개발이 필요할 때**:
브라우저 개발자 도구 → 콘솔에서:

```javascript
// 도움말 확인
devHelp()

// 개발용 토큰 빠른 설정
setDevToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3IiwiZW1haWwiOiJncm93c29tZS5tZUBnbWFpbC5jb20iLCJpYXQiOjE3NTM3NjAzMTUsImV4cCI6MTc1NjM1MjMxNX0.vgkcK_5QJcyYxe5A-T_ddJnEZQKJTfT6wiP175eIO0w")

// 현재 인증 상태 확인
debugAuth()
```

---

## 📊 예상 로그 출력

### **✅ 정상 동작 시**:
```
🔧 개발 환경 감지 - Growsome 로그인 연동 테스트 모드
🖥️ Electron 감지 결과: false
🌟 개발환경 Growsome 로그인 연동 테스트 시작
💡 개발용 토큰이 필요한 경우 브라우저 콘솔에서 setDevToken() 사용
🌐 Growsome 로그인 시작...
🏭 배포 환경 감지: false
🌐 현재 도메인: http://localhost:3000
🔧 개발 환경 - 배포환경과 동일한 직접 리다이렉트 테스트
🔗 개발 환경 직접 리다이렉트 URL: https://growsome.kr/login?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fgoogle-auth%2Fcallback
🌟 배포환경과 동일한 로그인 플로우 테스트 시작
```

### **콜백 페이지 (로그인 성공 시)**:
```
🔗 콜백 페이지 - URL 파라미터 확인
🔑 Access Token: Found
🔄 Refresh Token: Found
🌟 Growsome 로그인 토큰 처리 시작
✅ Growsome 토큰 설정 완료
```

---

## 🚨 문제 해결

### **❌ "리다이렉트 URL 오류"**:
- **원인**: Growsome에 `http://localhost:3000/google-auth/callback` 미등록
- **해결**: Growsome 관리자에게 URL 등록 요청

### **❌ "토큰 설정 오류"**:
- **확인**: 개발자 도구 → 콘솔 → 상세 에러 메시지 확인
- **해결**: `devHelp()` 입력 후 개발용 토큰 직접 설정

### **❌ "자동 돌아오기 실패"**:
- **확인**: `/google-auth/callback` 페이지에서 에러 메시지 확인
- **원인**: 네트워크 오류 또는 토큰 파싱 오류

---

## 🎯 테스트 완결 체크리스트

### **✅ 웹 브라우저 테스트**:
- [ ] 로그인 버튼 클릭 시 Growsome으로 리다이렉트
- [ ] Growsome 로그인 완료
- [ ] 자동으로 앱으로 돌아오기
- [ ] 사용자 정보 표시 (우상단 이메일)
- [ ] 모든 기능 사용 가능 (제휴영상 만들기 등)

### **✅ Electron 앱 테스트**:
- [ ] 로그인 버튼 클릭 시 외부 브라우저 열림
- [ ] Growsome 로그인 완료
- [ ] Electron 앱에서 로그인 상태 반영
- [ ] 모든 기능 사용 가능

### **✅ 개발자 도구 테스트**:
- [ ] `devHelp()` 명령어 작동
- [ ] `setDevToken()` 명령어 작동
- [ ] `debugAuth()` 명령어 작동

---

## 🎉 결론

**이제 개발환경에서 배포환경과 동일한 로그인 플로우를 완전히 테스트할 수 있습니다!**

- ✅ **실제 Growsome 로그인 연동 테스트**
- ✅ **배포환경과 동일한 직접 리다이렉트 방식**  
- ✅ **자동 토큰 설정 및 사용자 정보 로드**
- ✅ **필요시 개발용 토큰 빠른 설정 가능**

**테스트 완결 준비 완료!** 🚀 