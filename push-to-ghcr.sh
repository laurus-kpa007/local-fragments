#!/bin/bash
# GitHub Container Registry에 Docker 이미지 푸시하기
#
# 사용법:
#   1. GitHub Personal Access Token 생성:
#      https://github.com/settings/tokens/new
#      권한: write:packages, read:packages
#
#   2. 이 스크립트 실행:
#      bash push-to-ghcr.sh

# GitHub 사용자명 설정
GITHUB_USERNAME="laurus-kpa007"

echo "=== GitHub Container Registry 이미지 푸시 ==="
echo ""
echo "1. GitHub Personal Access Token이 필요합니다."
echo "2. https://github.com/settings/tokens/new 에서 생성하세요."
echo "3. 권한: write:packages, read:packages 필요"
echo ""
read -sp "GitHub Token을 입력하세요: " GITHUB_TOKEN
echo ""

# GitHub Container Registry 로그인
echo ""
echo "GHCR에 로그인 중..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ 로그인 실패!"
    exit 1
fi

echo "✅ 로그인 성공!"
echo ""

# 이미지가 있는지 확인
echo "로컬 이미지 확인 중..."
if ! docker images | grep -q "local-sandbox-python"; then
    echo "❌ local-sandbox-python 이미지를 찾을 수 없습니다."
    echo "먼저 'docker-compose build' 또는 개별 빌드를 실행하세요."
    exit 1
fi

if ! docker images | grep -q "local-sandbox-node"; then
    echo "❌ local-sandbox-node 이미지를 찾을 수 없습니다."
    exit 1
fi

echo "✅ 로컬 이미지 확인 완료"
echo ""

# 태그 생성
echo "이미지 태그 생성 중..."
docker tag local-sandbox-python:latest ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest
docker tag local-sandbox-node:latest ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest
echo "✅ 태그 생성 완료"
echo ""

# Python 이미지 푸시
echo "Python 이미지 푸시 중... (약 500-800MB)"
docker push ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest

if [ $? -ne 0 ]; then
    echo "❌ Python 이미지 푸시 실패!"
    exit 1
fi

echo "✅ Python 이미지 푸시 완료"
echo ""

# Node 이미지 푸시
echo "Node 이미지 푸시 중... (약 200-300MB)"
docker push ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest

if [ $? -ne 0 ]; then
    echo "❌ Node 이미지 푸시 실패!"
    exit 1
fi

echo "✅ Node 이미지 푸시 완료"
echo ""

echo "=========================================="
echo "🎉 모든 이미지가 성공적으로 업로드되었습니다!"
echo ""
echo "이미지 URL:"
echo "  - Python: ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"
echo "  - Node:   ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"
echo ""
echo "다른 컴퓨터에서 사용하려면:"
echo "  docker pull ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"
echo "  docker pull ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"
echo ""
echo "그 후 이미지 이름을 변경:"
echo "  docker tag ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest local-sandbox-python:latest"
echo "  docker tag ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest local-sandbox-node:latest"
echo "=========================================="
