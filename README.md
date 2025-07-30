# Coupas - 제휴영상 제작 도구

## 📥 다운로드 및 설치

### macOS 사용자

1. **다운로드**: [Releases 페이지](https://github.com/devatthearound/coupas/releases)에서 최신 버전의 `.dmg` 파일을 다운로드하세요.

2. **설치**: 
   - 다운로드한 `.dmg` 파일을 더블클릭하여 마운트
   - `coupas` 앱을 `Applications` 폴더로 드래그 앤 드롭

3. **첫 실행 시**:
   - **Finder**에서 `Applications` 폴더 열기
   - `coupas` 앱을 **우클릭** → **"열기"** 선택
   - 경고 창에서 **"열기"** 클릭
   - 이후에는 정상적으로 더블클릭으로 실행 가능

### Windows 사용자

1. **다운로드**: [Releases 페이지](https://github.com/devatthearound/coupas/releases)에서 `.exe` 파일을 다운로드
2. **설치**: 다운로드한 `.exe` 파일을 실행하여 설치

## 🚨 문제 해결

### macOS에서 "손상됨" 오류가 발생하는 경우

**방법 1: 우클릭으로 실행**
- Finder에서 `Applications` 폴더 열기
- `coupas` 앱 우클릭 → **"열기"** 선택
- 경고 창에서 **"열기"** 클릭

**방법 2: 시스템 환경설정에서 허용**
- **시스템 환경설정** → **보안 및 개인 정보 보호**
- **일반** 탭에서 **"확인 없이 열기"** 버튼 클릭
- `coupas` 앱을 허용 목록에 추가

**방법 3: 터미널 명령어 (고급 사용자용)**
```bash
sudo xattr -rd com.apple.quarantine /Applications/coupas.app
```

## 📋 시스템 요구사항

- **macOS**: 10.15 (Catalina) 이상
- **Windows**: Windows 10 이상
- **메모리**: 최소 4GB RAM 권장
- **저장공간**: 최소 1GB 여유 공간

## 🔧 개발자 정보

- **버전**: 1.0.43
- **라이선스**: MIT
- **개발자**: The Around

---

*이 앱은 개발 중인 버전으로, 일부 기능이 제한될 수 있습니다.*
