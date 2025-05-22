GitHub에서 `v*` 형식의 태그를 푸시하는 방법을 안내해 드리겠습니다. 이 태그를 푸시하면 설정한 GitHub Actions 워크플로가 실행되어 Electron 앱이 빌드되고 배포됩니다.

## 로컬에서 태그를 만들고 푸시하는 방법

### 1. 로컬 저장소에서 작업하는 경우:

먼저 최신 코드를 받아오고, 태그를 생성한 후 푸시합니다:

```bash
# 최신 코드 가져오기
git pull origin main  # 또는 master 등 주 브랜치 이름

# 태그 생성 (예: v0.1.0)
git tag v0.0.1

# 태그 푸시
git push origin v0.0.1
```

### 2. 특정 커밋에 태그를 붙이고 싶은 경우:

특정 커밋 해시에 태그를 붙일 수 있습니다:

```bash
# 특정 커밋에 태그 추가
git tag v0.1.0 <commit-hash>

# 태그 푸시
git push origin v0.1.0
```

### 3. 메시지와 함께 주석이 달린 태그를 만들고 싶은 경우:

```bash
# 주석이 달린 태그 생성
git tag -a v0.1.0 -m "릴리스 버전 0.1.0"

# 태그 푸시
git push origin v0.1.0
```

## GitHub 웹 인터페이스를 통해 태그와 릴리스 만들기

GitHub 웹사이트에서 직접 태그와 릴리스를 만들 수도 있습니다:

1. GitHub 저장소로 이동합니다.
2. "Releases" 탭을 클릭합니다. (또는 `https://github.com/사용자명/저장소명/releases`로 직접 이동)
3. "Draft a new release" 또는 "Create a new release" 버튼을 클릭합니다.
4. "Choose a tag" 필드에 새 태그 이름을 입력합니다(예: `v0.1.0`).
5. "Create new tag: v0.1.0 on publish" 옵션이 표시되면 선택합니다.
6. 릴리스 제목과 설명을 입력합니다.
7. "Publish release" 버튼을 클릭합니다.

이렇게 하면 태그가 생성되고 GitHub Actions 워크플로가 트리거됩니다.

## 시맨틱 버전 관리 지침

태그에는 시맨틱 버전 관리를 사용하는 것이 좋습니다:

- **v1.0.0**: 주요 릴리스(Major) - 호환되지 않는 API 변경
- **v1.1.0**: 부 릴리스(Minor) - 기능 추가(하위 호환성 유지)
- **v1.0.1**: 패치 릴리스(Patch) - 버그 수정(하위 호환성 유지)

## 워크플로 실행 확인

태그를 푸시한 후에는:

1. GitHub 저장소에서 "Actions" 탭으로 이동합니다.
2. "Build and Release Electron App" 워크플로가 실행 중인지 확인합니다.
3. 워크플로가 완료되면 "Releases" 페이지에서 빌드된 아티팩트를 확인할 수 있습니다.

워크플로 실행 중 문제가 발생하면 Actions 로그를 확인하여 디버깅할 수 있습니다. 