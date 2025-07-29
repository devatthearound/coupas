# AWS 도커 배포 - Growsome 로그인 연동 가이드

## 🚀 배포 환경 설정

### 1. 환경별 로그인 플로우

#### 🔧 개발 환경 (localhost)
- **Electron**: 자동 개발용 토큰 로그인
- **웹 브라우저**: 선택 대화상자 → 개발용 토큰 또는 Growsome 로그인

#### 🏭 배포 환경 (AWS 도커)
- **모든 환경**: 자동으로 Growsome 로그인으로 리다이렉트
- **로그인 후**: 원래 앱으로 자동 돌아옴

### 2. 배포 환경 자동 감지

```typescript
// 자동 감지 로직
const isDeployment = !window.location.origin.includes('localhost');

if (isDeployment) {
  // 배포 환경: 직접 Growsome으로 리다이렉트
  window.location.href = `https://growsome.kr/login?redirect_to=${callbackUrl}`;
} else {
  // 개발 환경: 새창으로 열기
  window.open(growsomeUrl, 'growsome_login', 'width=600,height=700');
}
```

### 3. 로그인 플로우

#### 📊 배포 환경 로그인 흐름:
```
1. 사용자가 로그인 버튼 클릭
   ↓
2. 배포 환경 자동 감지 (localhost가 아닌 도메인)
   ↓
3. https://growsome.kr/login?redirect_to=https://your-domain.com/google-auth/callback
   ↓
4. Growsome에서 로그인
   ↓
5. https://your-domain.com/google-auth/callback?access_token=...&refresh_token=...
   ↓
6. 토큰 자동 설정 및 사용자 정보 로드
   ↓
7. 메인 페이지로 자동 이동 (로그인 완료)
```

### 4. 필요한 Growsome 설정

#### 허용된 리다이렉트 URL 등록:
```
https://your-aws-domain.com/google-auth/callback
```

### 5. Docker 배포 시 확인사항

#### ✅ 환경 변수 (필요시 설정):
```bash
# .env.production (선택사항)
NODE_ENV=production
NEXT_PUBLIC_DEPLOYED_DOMAIN=https://your-aws-domain.com
```

#### ✅ Next.js 설정:
```javascript
// next.config.mjs
output: process.env.NODE_ENV === 'production' ? "standalone" : undefined
```

#### ✅ Docker 포트 설정:
```dockerfile
EXPOSE 3000
```

### 6. 배포 후 테스트

#### 🧪 로그인 테스트:
1. **배포된 앱 접속**: `https://your-aws-domain.com`
2. **로그인 버튼 클릭**: 자동으로 Growsome으로 이동
3. **Growsome 로그인**: 계정 정보 입력
4. **자동 돌아오기**: 원래 앱으로 토큰과 함께 리다이렉트
5. **로그인 완료**: 사용자 정보 표시 및 모든 기능 사용 가능

#### 🔍 문제 해결:
- **로그인이 안 되면**: 브라우저 개발자 도구 → Console 탭 확인
- **리다이렉트 오류**: Growsome에 올바른 콜백 URL 등록 확인
- **토큰 문제**: `/google-auth/callback` 페이지에서 에러 메시지 확인

### 7. 보안 고려사항

#### 🔒 프로덕션 환경:
- HTTPS 필수 (HTTP에서는 로그인 안됨)
- 쿠키는 `httpOnly`, `secure`, `sameSite: strict` 설정
- 토큰 만료 시간 자동 관리

#### 🛡️ 환경별 보안:
- **개발**: 개발용 토큰 사용 (제한된 권한)
- **배포**: 실제 Growsome 계정 연동 (전체 권한)

### 8. 모니터링

#### 📊 로그 확인:
```bash
# 배포 환경 로그
docker logs your-container-name | grep -E "(배포 환경|Growsome|로그인)"
```

#### 🔧 디버깅 정보:
- 미들웨어에서 자동으로 환경 감지 로그 출력
- 콜백 페이지에서 토큰 처리 과정 로그 출력
- 로그인 버튼에서 환경별 분기 로그 출력

---

## 🎯 결론

이제 **AWS 도커 배포 환경**에서 **Growsome 로그인 연동**이 완벽하게 작동합니다:

✅ **개발 환경**: 빠른 개발용 토큰 로그인  
✅ **배포 환경**: 실제 Growsome 계정 연동  
✅ **자동 감지**: 환경별 자동 분기 처리  
✅ **원활한 UX**: 로그인 후 자동 돌아오기  

**배포만 하면 바로 사용 가능합니다!** 🚀 