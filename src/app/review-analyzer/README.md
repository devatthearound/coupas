# 쿠팡 리뷰 분석기 개발 계획서

## 📋 프로젝트 개요

### 목표
쿠팡 상품 리뷰를 크롤링하고 AI로 분석하여 구매 결정에 도움이 되는 인사이트를 제공하는 웹 애플리케이션 및 크롬 확장프로그램 개발

### 핵심 기능
- 🔍 쿠팡 상품 리뷰 자동 크롤링
- 🤖 AI 기반 감정 분석 (긍정/부정/중립)
- 📊 키워드 추출 및 빈도 분석
- 📈 시각화 및 보고서 생성
- 📱 크롬 확장프로그램 연동

## 🏗️ 기술 스택

### Frontend
- **웹 애플리케이션**: Next.js 15, React, TypeScript
- **크롬 확장프로그램**: Vanilla JS, Manifest V3
- **스타일링**: TailwindCSS
- **차트**: Chart.js, Recharts
- **상태 관리**: React Hooks

### Backend
- **API**: Next.js API Routes
- **크롤링**: Python + Selenium + BeautifulSoup
- **AI 분석**: 
  - TextBlob (기본 감정 분석)
  - KoBERT (고급 한국어 감정 분석, 추후)
- **데이터 처리**: Pandas, NumPy

### Infrastructure
- **데이터베이스**: PostgreSQL (Supabase)
- **파일 저장**: Local Storage + AWS S3 (추후)
- **배포**: Vercel (웹), Chrome Web Store (확장프로그램)

## 📁 프로젝트 구조

```
/tools/review-analyzer/
├── README.md                    # 이 파일
├── ux-flow.json                # UX 플로우 정의
├── page.tsx                    # 메인 페이지
├── components/                 # React 컴포넌트들
│   ├── URLInput.tsx           # URL 입력 폼
│   ├── AnalysisProgress.tsx   # 진행상황 표시
│   ├── ResultDashboard.tsx    # 결과 대시보드
│   ├── SentimentChart.tsx     # 감정 분석 차트
│   ├── KeywordCloud.tsx       # 키워드 클라우드
│   └── ReviewTable.tsx        # 리뷰 테이블
├── api/                       # API 엔드포인트
│   ├── analyze/               # 분석 시작
│   ├── status/                # 진행상황 확인
│   └── results/               # 결과 조회
├── lib/                       # 유틸리티 함수들
│   ├── crawler.ts             # 크롤링 로직
│   ├── analyzer.ts            # 분석 로직
│   └── types.ts               # 타입 정의
├── chrome-extension/          # 크롬 확장프로그램
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   └── background.js
└── python/                    # Python 크롤링 스크립트
    ├── requirements.txt
    ├── coupang_crawler.py
    ├── sentiment_analyzer.py
    └── report_generator.py
```

## 🎯 개발 로드맵

### Phase 1: 웹 애플리케이션 기본 기능 (2주)

#### Week 1: 기반 구조 및 크롤링
- [x] 프로젝트 구조 설계
- [ ] URL 입력 및 검증 컴포넌트
- [ ] Python 크롤링 스크립트 개발
- [ ] Next.js API 연동
- [ ] 진행상황 표시 (실시간 업데이트)

#### Week 2: AI 분석 및 시각화
- [ ] 감정 분석 로직 구현
- [ ] 키워드 추출 및 분석
- [ ] 차트 및 시각화 컴포넌트
- [ ] 결과 대시보드 완성
- [ ] 보고서 생성 및 다운로드

### Phase 2: 크롬 확장프로그램 (1주)

#### Week 3: 확장프로그램 개발
- [ ] Manifest V3 설정
- [ ] 팝업 UI 개발
- [ ] Content Script (쿠팡 페이지 상호작용)
- [ ] 웹 애플리케이션 API 연동
- [ ] 크롬 웹스토어 등록 준비

### Phase 3: 고도화 및 최적화 (지속적)

- [ ] 성능 최적화 (크롤링 속도, 메모리 사용량)
- [ ] 고급 AI 분석 (KoBERT, 토픽 모델링)
- [ ] 사용자 인증 및 히스토리 저장
- [ ] 실시간 모니터링 및 알림
- [ ] 다중 상품 비교 분석

## 🔧 핵심 기능 상세

### 1. 리뷰 크롤링
```python
# 크롤링 파라미터
- 최대 리뷰 수: 10 ~ 500개
- 크롤링 속도: 2-3초 간격 (서버 부하 방지)
- 데이터 추출: 평점, 텍스트, 날짜, 도움됨 수
- 에러 처리: 네트워크 오류, 페이지 변경 대응
```

### 2. AI 감정 분석
```python
# 분석 메트릭
- 감정 분류: 긍정/부정/중립 (신뢰도 포함)
- 감정 점수: -1.0 ~ 1.0 (연속값)
- 키워드 추출: TF-IDF 기반 상위 20개
- 토픽 모델링: LDA 알고리즘 (추후)
```

### 3. 시각화
```javascript
// 차트 종류
- 평점 분포: 막대 차트
- 감정 분포: 파이 차트  
- 시간별 트렌드: 라인 차트
- 키워드 클라우드: 워드 클라우드
- 리뷰 길이 분포: 히스토그램
```

## 📊 데이터 모델

### 분석 요청 (Request)
```typescript
interface AnalysisRequest {
  url: string;              // 쿠팡 상품 URL
  maxReviews: number;       // 최대 리뷰 수 (10-500)
  analysisType: 'basic' | 'advanced';
  userId?: string;          // 사용자 ID (선택)
}
```

### 분석 결과 (Response)
```typescript
interface AnalysisResult {
  id: string;               // 분석 ID
  productInfo: {
    title: string;
    url: string;
    rating: number;
    reviewCount: number;
  };
  statistics: {
    totalReviews: number;
    avgRating: number;
    ratingDistribution: Record<1|2|3|4|5, number>;
    avgReviewLength: number;
  };
  sentiment: {
    positive: number;       // 비율 (%)
    negative: number;
    neutral: number;
    score: number;          // 전체 감정 점수
  };
  keywords: Array<{
    word: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  charts: {
    ratingChart: ChartData;
    sentimentChart: ChartData;
    trendChart: ChartData;
  };
  generatedAt: string;      // ISO 8601
  downloadUrls: {
    csv: string;
    json: string;
    report: string;
  };
}
```

## 🚀 API 엔드포인트

### POST `/api/tools/review-analyzer/analyze`
분석 시작
```json
{
  "url": "https://www.coupang.com/vp/products/123456789",
  "maxReviews": 100,
  "analysisType": "basic"
}
```

### GET `/api/tools/review-analyzer/status/:id`
진행상황 확인
```json
{
  "id": "analysis_123",
  "status": "crawling | analyzing | completed | error",
  "progress": 65,
  "message": "리뷰 65/100개 수집 완료",
  "estimatedTime": 120
}
```

### GET `/api/tools/review-analyzer/results/:id`
결과 조회
```json
{
  "success": true,
  "analysis": AnalysisResult
}
```

## 🔒 보안 및 제한사항

### Rate Limiting
- IP당 시간당 10회 분석 제한
- 사용자당 일일 50회 제한
- 동시 분석 최대 3개

### 데이터 보호
- 개인정보 비식별화
- 24시간 후 자동 삭제
- HTTPS 암호화 통신

### 법적 준수
- robots.txt 준수
- 이용약관 명시
- 과도한 요청 방지

## 🧪 테스트 계획

### 단위 테스트
- 크롤링 함수 테스트
- 감정 분석 정확도 테스트
- API 응답 검증

### 통합 테스트
- 전체 분석 플로우 테스트
- 에러 상황 시나리오 테스트
- 성능 부하 테스트

### 사용자 테스트
- 다양한 상품 카테고리 테스트
- 브라우저 호환성 테스트
- 모바일 반응형 테스트

## 📈 성능 목표

- **크롤링 속도**: 리뷰 100개 기준 2-3분
- **분석 속도**: 수집된 데이터 분석 30초 이내
- **응답 시간**: API 응답 1초 이내
- **동시 사용자**: 최대 50명
- **정확도**: 감정 분석 80% 이상

## 📋 체크리스트

### 개발 완료 기준
- [ ] 기본 웹 애플리케이션 동작
- [ ] 크롬 확장프로그램 동작
- [ ] 모든 차트 및 시각화 완성
- [ ] 에러 처리 및 사용자 피드백
- [ ] 성능 최적화 완료
- [ ] 보안 검토 완료
- [ ] 문서화 완료

### 배포 준비
- [ ] 프로덕션 환경 설정
- [ ] 도메인 및 SSL 인증서
- [ ] 모니터링 시스템 구축
- [ ] 백업 및 복구 계획
- [ ] 크롬 웹스토어 등록

## 🔮 향후 계획

### 고급 기능
- 경쟁사 상품 비교 분석
- 리뷰 트렌드 예측
- 개인화된 추천 시스템
- 실시간 가격 추적 연동

### 확장 가능성
- 다른 쇼핑몰 지원 (11번가, G마켓 등)
- 모바일 앱 개발
- B2B 서비스 제공
- API 서비스 상품화

---

**개발 시작일**: 2025년 1월 28일  
**예상 완료일**: 2025년 2월 18일 (Phase 2까지)  
**담당자**: Growsome Development Team  
**문의**: dev@growsome.kr
