#!/bin/bash
# local-build.sh - 로컬 환경에서 Electron 앱 빌드

# 환경 설정
export NODE_OPTIONS=--max-old-space-size=8192
export SKIP_NOTARIZATION=true

# Next.js 빌드
echo "Next.js 빌드 시작..."
npm run next:build

# Electron 빌드
echo "Electron 빌드 시작..."
npm run electron:build

# Electron 패키징 (macOS x64)
echo "macOS x64 패키징 시작..."
npx electron-builder build --mac --x64 --publish never

# Electron 패키징 (macOS arm64)
echo "macOS arm64 패키징 시작..."
npx electron-builder build --mac --arm64 --publish never

echo "빌드 완료! 결과물 위치: releases/ 디렉토리"