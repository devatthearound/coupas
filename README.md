# Coupas - 쿠팡 파트너스 영상 생성기

**Coupas**는 쿠팡 파트너스를 위한 전문적인 YouTube 동영상 생성 및 관리 데스크톱 애플리케이션입니다.

## 🌟 주요 특징

### 📱 **멋진 랜딩페이지**
- 현대적이고 반응형 디자인
- 제품 기능을 한눈에 보여주는 섹션별 구성
- 원클릭 다운로드 (Mac/Windows 자동 감지)

### 🚀 **핵심 기능**
- **쿠팡 파트너스 API 연동**: 간편한 API 설정으로 상품 정보 자동 가져오기
- **자동 영상 제작**: 템플릿 기반 전문적인 상품 소개 영상 생성
- **스마트 레이아웃**: 상품 정보와 이미지의 최적화된 자동 배치
- **유튜브 자동 업로드**: 원클릭으로 영상 업로드 및 SEO 최적화
- **템플릿 관리**: 다양한 템플릿 저장 및 커스텀 제작

### 📊 **트렌드 분석**
- 실시간 키워드 트렌드 모니터링
- 검색량 기반 키워드 분석
- 타겟 오디언스 분석 도구

## 🏗️ 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Desktop**: Electron 31
- **Styling**: Tailwind CSS (커스텀 컬러 팔레트)
- **Database**: PostgreSQL
- **AI/ML**: OpenAI API
- **Media**: FFmpeg (비디오 처리)
- **Cloud**: Google APIs (YouTube, Auth)
- **Automation**: Discord.js (봇 기능)

## 📁 프로젝트 구조

```
coupas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 🆕 새로운 랜딩페이지
│   │   ├── layout.tsx         # 조건부 네비게이션 레이아웃
│   │   ├── api/               # API 라우트
│   │   ├── components/        # 페이지별 컴포넌트
│   │   ├── youtube/           # YouTube 연동 페이지
│   │   └── ...
│   ├── components/
│   │   ├── ui/                # 공통 UI 컴포넌트
│   │   └── landing/           # 🆕 랜딩페이지 컴포넌트
│   │       ├── Header.tsx
│   │       ├── HeroSection.tsx
│   │       ├── FeatureSection.tsx
│   │       ├── ApiSection.tsx
│   │       ├── VideoSection.tsx
│   │       ├── KeywordSection.tsx
│   │       ├── DownloadSection.tsx
│   │       └── Footer.tsx
│   └── ...
├── electron/                  # Electron 메인 프로세스
├── bot/                      # YouTube 키워드 모니터링 봇 (Python)
└── public/                   # 정적 파일
```

## 🎨 디자인 시스템

### 컬러 팔레트
```css
coupas: {
  primary: '#6366F1',    /* 메인 브랜드 컬러 */
  secondary: '#4F46E5',  /* 호버 상태 */
  light: '#EEF2FF',     /* 배경색 */
  dark: '#1E1B4B'       /* 텍스트 */
}
```

### 애니메이션
- `fade-in`: 부드러운 등장 애니메이션
- `bounce-subtle`: 미세한 바운스 효과

## 🚀 개발 환경 설정

### 필수 요구사항
- Node.js 16 이상
- npm 또는 yarn

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (랜딩페이지 포함)
npm run next:dev

# Electron 개발 모드
npm run dev

# 프로덕션 빌드
npm run build

# 데스크톱 앱 배포 빌드
npm run dist
```

## 📱 랜딩페이지 기능

### 🎯 주요 섹션
1. **Hero Section**: 메인 타이틀과 시작하기/다운로드 CTA
2. **Feature Section**: 5가지 핵심 기능 소개
3. **API Section**: 쿠팡 파트너스 API 연동 가이드
4. **Video Section**: 영상 제작 및 업로드 프로세스
5. **Keyword Section**: 실시간 트렌드 분석 도구
6. **Download Section**: 플랫폼별 다운로드 옵션

### 🔧 스마트 기능
- **자동 OS 감지**: Mac (Intel/Apple Silicon) 및 Windows 자동 구분
- **부드러운 스크롤**: 네비게이션 메뉴 클릭시 해당 섹션으로 이동
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화

## 🤖 YouTube 모니터링 봇

`bot/` 디렉토리의 Python 봇:
- 특정 키워드가 포함된 YouTube 영상 모니터링
- Discord 웹훅을 통한 실시간 알림
- 조회수 기반 필터링
- 상세한 로그 기능

## 📦 배포

### Desktop App
- **Mac**: `.dmg` (Intel/Apple Silicon 지원)
- **Windows**: `.exe` (64비트)
- GitHub Releases를 통한 자동 업데이트

### Web Version
- Next.js 정적 빌드 지원
- Vercel, Netlify 등 배포 가능

## 🔄 최근 업데이트 (v1.0.11)

- ✨ **새로운 랜딩페이지 추가**
- 🎨 모던한 디자인 시스템 적용
- 📱 완전 반응형 레이아웃
- ⚡ 성능 최적화된 애니메이션
- 🔗 스마트 다운로드 링크
- 🎯 사용자 경험 개선

## 👥 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

- **Threads**: [@coupas_do](https://www.threads.com/@coupas_do)
- **YouTube**: [@growsome-ai](https://www.youtube.com/@growsome-ai)
- **Company**: 디어라운드 주식회사

---

**Coupas**로 쿠팡 파트너스 영상 제작의 새로운 경험을 시작하세요! 🚀
