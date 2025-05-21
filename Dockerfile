# 베이스 이미지로 Node.js 사용
FROM node:20-slim

# Electron 캐시 설정
ENV ELECTRON_CACHE="/root/.cache/electron"
ENV ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder"

# 필요한 도구 설치 (Windows 및 macOS 빌드에 필요한 도구들)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    git \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxtst6 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    # Wine 설치 (Windows 빌드에 필요)
    wine64 \
    # 추가 의존성
    fakeroot \
    rpm \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (레이어 캐싱 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 기본 빌드 명령 (macOS arm64와 x64, Windows x64)
CMD ["npm", "run", "build-all"]