# Docker 이미지 Registry 가이드

## GitHub Container Registry에 업로드된 이미지

프로젝트의 Docker 이미지가 GitHub Container Registry에 업로드되어 있습니다.

### 📦 이미지 URL

- **Python (matplotlib 포함)**: `ghcr.io/laurus-kpa007/local-fragments-python:latest`
- **Node.js**: `ghcr.io/laurus-kpa007/local-fragments-node:latest`

---

## 다른 컴퓨터에서 사용하기

### 1단계: 이미지 다운로드

```bash
# Python 이미지 다운로드
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest

# Node 이미지 다운로드
docker pull ghcr.io/laurus-kpa007/local-fragments-node:latest
```

### 2단계: 이미지 이름 변경

프로젝트 코드가 `local-sandbox-python`과 `local-sandbox-node` 이름을 사용하므로, 다운로드한 이미지의 태그를 변경해야 합니다.

```bash
# Python 이미지 태그 변경
docker tag ghcr.io/laurus-kpa007/local-fragments-python:latest local-sandbox-python:latest

# Node 이미지 태그 변경
docker tag ghcr.io/laurus-kpa007/local-fragments-node:latest local-sandbox-node:latest
```

### 3단계: 확인

```bash
docker images | grep local-sandbox
```

다음과 같이 표시되어야 합니다:
```
local-sandbox-python   latest   ...   819MB
local-sandbox-node     latest   ...   289MB
```

---

## 빠른 설정 스크립트

### Windows (PowerShell)

```powershell
# 이미지 다운로드 및 태그 변경
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest
docker pull ghcr.io/laurus-kpa007/local-fragments-node:latest

docker tag ghcr.io/laurus-kpa007/local-fragments-python:latest local-sandbox-python:latest
docker tag ghcr.io/laurus-kpa007/local-fragments-node:latest local-sandbox-node:latest

Write-Host "✅ Docker 이미지 준비 완료!" -ForegroundColor Green
```

### Linux/Mac (Bash)

```bash
# 이미지 다운로드 및 태그 변경
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest
docker pull ghcr.io/laurus-kpa007/local-fragments-node:latest

docker tag ghcr.io/laurus-kpa007/local-fragments-python:latest local-sandbox-python:latest
docker tag ghcr.io/laurus-kpa007/local-fragments-node:latest local-sandbox-node:latest

echo "✅ Docker 이미지 준비 완료!"
```

---

## 전체 설치 가이드 (처음부터)

### 필수 요구사항

- Docker Desktop 설치 및 실행 중
- Git 설치
- Node.js 18+ 설치
- Ollama 설치 및 모델 다운로드

### 설치 단계

```bash
# 1. 저장소 클론
git clone https://github.com/laurus-kpa007/local-fragments.git
cd local-fragments

# 2. Docker 이미지 다운로드 (방화벽 환경)
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest
docker pull ghcr.io/laurus-kpa007/local-fragments-node:latest

# 3. 이미지 태그 변경
docker tag ghcr.io/laurus-kpa007/local-fragments-python:latest local-sandbox-python:latest
docker tag ghcr.io/laurus-kpa007/local-fragments-node:latest local-sandbox-node:latest

# 4. npm 패키지 설치
npm install

# 5. Ollama 모델 다운로드 (예시)
ollama pull gemma2:2b

# 6. 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 방화벽 환경에서의 장점

### ❌ 일반적인 방법 (docker-compose build)

```bash
docker-compose build  # ❌ 방화벽에서 차단됨
```

**문제점**:
- Python 패키지 다운로드 차단 (pip install)
- APT 패키지 다운로드 차단 (apt-get)
- Node.js 베이스 이미지 다운로드 차단
- 빌드 시간 5-10분 소요

### ✅ Registry 방법 (docker pull)

```bash
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest
docker pull ghcr.io/laurus-kpa007/local-fragments-node:latest
```

**장점**:
- ✅ 이미 빌드된 이미지 다운로드
- ✅ 1-2분 만에 완료
- ✅ 방화벽 환경에서도 작동 (GitHub 접근만 필요)
- ✅ 별도의 빌드 도구 불필요

---

## 이미지 업데이트

프로젝트가 업데이트되어 새로운 Docker 이미지가 필요한 경우:

```bash
# 기존 이미지 삭제
docker rmi local-sandbox-python:latest
docker rmi local-sandbox-node:latest

# 최신 이미지 다운로드
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest
docker pull ghcr.io/laurus-kpa007/local-fragments-node:latest

# 태그 재설정
docker tag ghcr.io/laurus-kpa007/local-fragments-python:latest local-sandbox-python:latest
docker tag ghcr.io/laurus-kpa007/local-fragments-node:latest local-sandbox-node:latest
```

---

## 이미지 정보

### Python 이미지 (local-sandbox-python)

**베이스**: `python:3.11-slim`
**크기**: ~819 MB

**포함 패키지**:
- matplotlib (차트 생성)
- numpy (수치 계산)
- pandas (데이터 분석)
- NanumGothic 폰트 (한글 지원)

**지원 기능**:
- Python 코드 실행
- matplotlib 차트 생성
- 한글 텍스트 렌더링

### Node 이미지 (local-sandbox-node)

**베이스**: `node:20-slim`
**크기**: ~289 MB

**포함 패키지**:
- Node.js 20
- 내장 모듈만 (fs, path, crypto, http 등)

**지원 기능**:
- JavaScript 코드 실행
- Node.js 내장 모듈 사용

---

## 문제 해결

### Q: "denied: permission_denied" 에러

**원인**: 이미지가 비공개(private)로 설정됨

**해결**: 이미지를 공개(public)로 변경
1. https://github.com/users/laurus-kpa007/packages 접속
2. 해당 패키지 선택
3. "Package settings" → "Change package visibility" → "Public"

또는 GitHub 로그인 후 다운로드:
```bash
echo YOUR_TOKEN | docker login ghcr.io -u laurus-kpa007 --password-stdin
docker pull ghcr.io/laurus-kpa007/local-fragments-python:latest
```

### Q: 다운로드가 너무 느림

**해결**: Docker Hub 미러 사용 또는 다른 네트워크에서 다운로드 후 `docker save`/`docker load` 사용

### Q: 이미지가 최신 버전이 아님

**해결**: 캐시된 이미지 삭제 후 재다운로드
```bash
docker pull --no-cache ghcr.io/laurus-kpa007/local-fragments-python:latest
```

---

## 관련 문서

- [Docker 이미지 내보내기/가져오기](DOCKER_EXPORT_GUIDE.md)
- [메인 README](README.md)
- [테스트 가이드](TESTING.md)

---

**요약**: 방화벽 환경에서는 GitHub Container Registry에서 이미지를 다운로드하고 태그를 변경하여 사용하세요!
