#!/bin/bash

# 도커 빌드
docker-compose build

# macOS 빌드 (M1/ARM64)
echo "Building for macOS ARM64..."
docker-compose run --rm electron-builder npm run build-mac-arm64

# macOS 빌드 (Intel/x64)
echo "Building for macOS x64..."
docker-compose run --rm electron-builder npm run build-mac-x64

# Windows 빌드 (x64)
echo "Building for Windows x64..."
docker-compose run --rm electron-builder npm run build-win-x64

# Windows 빌드 (ARM64)
echo "Building for Windows ARM64..."
docker-compose run --rm electron-builder npm run build-win-arm64

echo "Build completed. Check the 'releases' directory for output."