# GitHub Container Registry에 Docker 이미지 푸시하기 (PowerShell)
#
# 사용법:
#   1. GitHub Personal Access Token 생성:
#      https://github.com/settings/tokens/new
#      권한: write:packages, read:packages
#
#   2. PowerShell에서 실행:
#      .\push-to-ghcr.ps1

# GitHub 사용자명 설정
$GITHUB_USERNAME = "laurus-kpa007"

Write-Host "=== GitHub Container Registry 이미지 푸시 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. GitHub Personal Access Token이 필요합니다."
Write-Host "2. https://github.com/settings/tokens/new 에서 생성하세요."
Write-Host "3. 권한: write:packages, read:packages 필요"
Write-Host ""

# 토큰 입력
$GITHUB_TOKEN = Read-Host "GitHub Token을 입력하세요" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($GITHUB_TOKEN)
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# GitHub Container Registry 로그인
Write-Host ""
Write-Host "GHCR에 로그인 중..." -ForegroundColor Yellow
$PlainToken | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 로그인 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 로그인 성공!" -ForegroundColor Green
Write-Host ""

# 이미지가 있는지 확인
Write-Host "로컬 이미지 확인 중..." -ForegroundColor Yellow
$images = docker images | Select-String "local-sandbox"

if (-not $images) {
    Write-Host "❌ local-sandbox 이미지를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "먼저 'docker-compose build' 또는 개별 빌드를 실행하세요." -ForegroundColor Red
    exit 1
}

Write-Host "✅ 로컬 이미지 확인 완료" -ForegroundColor Green
Write-Host ""

# 태그 생성
Write-Host "이미지 태그 생성 중..." -ForegroundColor Yellow
docker tag local-sandbox-python:latest "ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"
docker tag local-sandbox-node:latest "ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"
Write-Host "✅ 태그 생성 완료" -ForegroundColor Green
Write-Host ""

# Python 이미지 푸시
Write-Host "Python 이미지 푸시 중... (약 500-800MB)" -ForegroundColor Yellow
docker push "ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python 이미지 푸시 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python 이미지 푸시 완료" -ForegroundColor Green
Write-Host ""

# Node 이미지 푸시
Write-Host "Node 이미지 푸시 중... (약 200-300MB)" -ForegroundColor Yellow
docker push "ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node 이미지 푸시 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node 이미지 푸시 완료" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 모든 이미지가 성공적으로 업로드되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "이미지 URL:" -ForegroundColor Cyan
Write-Host "  - Python: ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"
Write-Host "  - Node:   ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"
Write-Host ""
Write-Host "다른 컴퓨터에서 사용하려면:" -ForegroundColor Cyan
Write-Host "  docker pull ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest"
Write-Host "  docker pull ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest"
Write-Host ""
Write-Host "그 후 이미지 이름을 변경:" -ForegroundColor Cyan
Write-Host "  docker tag ghcr.io/$GITHUB_USERNAME/local-fragments-python:latest local-sandbox-python:latest"
Write-Host "  docker tag ghcr.io/$GITHUB_USERNAME/local-fragments-node:latest local-sandbox-node:latest"
Write-Host "==========================================" -ForegroundColor Cyan
