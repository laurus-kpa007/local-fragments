# GitHub Container Registry에서 Docker 이미지 다운로드 (PowerShell)
#
# 사용법:
#   .\pull-from-ghcr.ps1

$GITHUB_USERNAME = "laurus-kpa007"

Write-Host "=== Local Fragments Docker 이미지 다운로드 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Container Registry에서 이미지를 다운로드합니다..." -ForegroundColor Yellow
Write-Host ""

# Python 이미지 다운로드
Write-Host "📦 Python 이미지 다운로드 중... (약 819MB)" -ForegroundColor Yellow
docker pull "ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python 이미지 다운로드 실패!" -ForegroundColor Red
    Write-Host ""
    Write-Host "이미지가 비공개(private)인 경우 로그인이 필요합니다:" -ForegroundColor Yellow
    Write-Host "  echo YOUR_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin" -ForegroundColor White
    exit 1
}

Write-Host "✅ Python 이미지 다운로드 완료" -ForegroundColor Green
Write-Host ""

# Node 이미지 다운로드
Write-Host "📦 Node 이미지 다운로드 중... (약 289MB)" -ForegroundColor Yellow
docker pull "ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node 이미지 다운로드 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node 이미지 다운로드 완료" -ForegroundColor Green
Write-Host ""

# 태그 변경
Write-Host "🏷️  이미지 태그 변경 중..." -ForegroundColor Yellow
docker tag "ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest" "local-sandbox-python:latest"
docker tag "ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest" "local-sandbox-node:latest"

Write-Host "✅ 태그 변경 완료" -ForegroundColor Green
Write-Host ""

# 확인
Write-Host "📋 설치된 이미지:" -ForegroundColor Cyan
docker images | Select-String -Pattern "REPOSITORY|local-sandbox"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Docker 이미지 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "  1. npm install" -ForegroundColor White
Write-Host "  2. ollama pull gemma2:2b  # 또는 다른 모델" -ForegroundColor White
Write-Host "  3. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "브라우저에서 http://localhost:3000 접속" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
