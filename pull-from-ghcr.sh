#!/bin/bash
# GitHub Container Registry에서 Docker 이미지 다운로드
#
# 사용법:
#   bash pull-from-ghcr.sh

GITHUB_USERNAME="laurus-kpa007"

echo "=== Local Fragments Docker 이미지 다운로드 ==="
echo ""
echo "GitHub Container Registry에서 이미지를 다운로드합니다..."
echo ""

# Python 이미지 다운로드
echo "📦 Python 이미지 다운로드 중... (약 819MB)"
docker pull ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest

if [ $? -ne 0 ]; then
    echo "❌ Python 이미지 다운로드 실패!"
    echo ""
    echo "이미지가 비공개(private)인 경우 로그인이 필요합니다:"
    echo "  echo YOUR_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin"
    exit 1
fi

echo "✅ Python 이미지 다운로드 완료"
echo ""

# Node 이미지 다운로드
echo "📦 Node 이미지 다운로드 중... (약 289MB)"
docker pull ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest

if [ $? -ne 0 ]; then
    echo "❌ Node 이미지 다운로드 실패!"
    exit 1
fi

echo "✅ Node 이미지 다운로드 완료"
echo ""

# 태그 변경
echo "🏷️  이미지 태그 변경 중..."
docker tag ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest local-sandbox-python:latest
docker tag ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest local-sandbox-node:latest

echo "✅ 태그 변경 완료"
echo ""

# 확인
echo "📋 설치된 이미지:"
docker images | grep -E "(REPOSITORY|local-sandbox)"
echo ""

echo "=========================================="
echo "🎉 Docker 이미지 설정 완료!"
echo ""
echo "다음 단계:"
echo "  1. npm install"
echo "  2. ollama pull gemma2:2b  # 또는 다른 모델"
echo "  3. npm run dev"
echo ""
echo "브라우저에서 http://localhost:3000 접속"
echo "=========================================="
