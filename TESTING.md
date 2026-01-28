# Template Testing Guide

## 각 템플릿 타입 테스트 방법

### 1. ✅ HTML/CSS (Docker 불필요)
**상태**: 항상 작동
**테스트 방법**:
```
프롬프트: "간단한 로그인 폼 만들어줘"
```

**예상 결과**:
- 좌측: 사용자 메시지 + AI 응답 + 아티팩트 카드
- 우측: HTML 프리뷰 즉시 표시
- "Source" 버튼으로 HTML 소스 확인 가능
- "Export DOCX" 버튼으로 다운로드 가능

---

### 2. ✅ Mermaid Diagram (Docker 불필요)
**상태**: 항상 작동
**테스트 방법**:
```
프롬프트: "사용자 로그인 플로우차트 만들어줘"
```

**예상 결과**:
- 좌측: 사용자 메시지 + AI 응답 + 아티팩트 카드
- 우측: Mermaid 다이어그램 렌더링
- 다이어그램이 자동으로 생성됨

---

### 3. 🐍 Python (Docker 필요)
**상태**: Docker가 실행 중일 때만 작동
**테스트 방법**:
```
프롬프트: "피보나치 수열 10개 출력하는 코드"
```

**Docker 확인**:
1. Docker Desktop이 실행 중인지 확인
2. 상단 헤더에서 "Docker ✓" 표시 확인
3. 이미지 확인: `docker images | grep python`
   - `python:3.11-slim` 이미지가 자동으로 다운로드됨

**예상 결과**:
- 좌측: 아티팩트 카드에 "▶ Run" 버튼 표시
- 우측: "Run" 버튼 클릭 후 출력 결과 표시
- 실행 시간 표시 (예: 1234ms)

**에러 발생 시**:
- Docker 미실행: "Docker is not available" 에러
- 해결: Docker Desktop 실행

---

### 4. 📊 Python Chart (Docker 필요 + 커스텀 이미지)
**상태**: Docker + `local-sandbox-python` 이미지 필요
**테스트 방법**:
```
프롬프트: "월별 매출 데이터로 막대 차트 만들어줘"
```

**사전 준비**:
```bash
# 커스텀 이미지 빌드 (matplotlib 포함)
docker build -t local-sandbox-python ./docker/python
```

또는 프로그램 내에서 자동 빌드:
```bash
# 이미지가 없으면 자동으로 에러 메시지 표시
# "Local image local-sandbox-python not found. Please build it first."
```

**예상 결과**:
- 좌측: 아티팩트 카드
- 우측: Python 코드 실행 후 생성된 차트 이미지 표시
- 이미지가 Base64로 인코딩되어 표시됨

**에러 발생 시**:
- 이미지 없음: "Local image local-sandbox-python not found"
- 해결: `docker build -t local-sandbox-python ./docker/python` 실행

---

### 5. ⚡ JavaScript/Node.js (Docker 필요)
**상태**: Docker가 실행 중일 때만 작동
**테스트 방법**:
```
프롬프트: "JSON 객체를 파싱하고 포맷팅하는 코드"
```

**Docker 확인**:
1. Docker Desktop 실행 중
2. 이미지 확인: `docker images | grep node`
   - `node:20-slim` 이미지가 자동으로 다운로드됨

**예상 결과**:
- 좌측: 아티팩트 카드에 "▶ Run" 버튼
- 우측: Node.js 실행 결과 출력
- console.log 출력이 "Output" 섹션에 표시됨

---

## Windows 환경 Docker 설정

### Docker Desktop 설치 확인
```powershell
# Docker 실행 확인
docker --version

# Docker 서비스 상태
docker ps
```

### Named Pipe 확인
Windows에서는 `\\\\.\\pipe\\docker_engine` 사용
- Docker Desktop이 실행 중이면 자동으로 설정됨
- 설정 확인: Docker Desktop → Settings → General → "Expose daemon on tcp://localhost:2375" (체크 불필요)

### 일반적인 문제

1. **"Docker is not available"**
   - 원인: Docker Desktop이 실행되지 않음
   - 해결: Docker Desktop 실행

2. **"Cannot connect to Docker daemon"**
   - 원인: Docker 서비스 시작 실패
   - 해결: Docker Desktop 재시작

3. **"Image not found"**
   - Python: `docker pull python:3.11-slim`
   - Node: `docker pull node:20-slim`
   - Python Chart: `docker build -t local-sandbox-python ./docker/python`

4. **볼륨 마운트 오류**
   - 원인: Windows 경로 형식 문제
   - 해결: 자동 변환 로직이 적용되어 있음 (C:\\ → /c/)
   - Docker Desktop → Settings → Resources → File Sharing에서 C 드라이브 공유 확인

---

## 템플릿별 작동 요약

| 템플릿 | Docker 필요 | 이미지 | 자동 실행 | 수동 실행 |
|--------|------------|--------|-----------|----------|
| HTML/CSS | ❌ | - | ✅ | - |
| Mermaid | ❌ | - | ✅ | - |
| Python | ✅ | python:3.11-slim | ❌ | ✅ (Run 버튼) |
| Python Chart | ✅ | local-sandbox-python | ❌ | ✅ (Run 버튼) |
| JavaScript | ✅ | node:20-slim | ❌ | ✅ (Run 버튼) |

---

## 디버깅 팁

### 1. 브라우저 개발자 도구 확인
- F12 → Console 탭
- 네트워크 에러나 API 응답 확인

### 2. 서버 로그 확인
```bash
# Next.js 개발 서버 로그 확인
npm run dev
```

### 3. Docker 로그 확인
```bash
# 실행 중인 컨테이너 확인
docker ps

# 최근 종료된 컨테이너 확인
docker ps -a | head -5

# 컨테이너 로그 확인
docker logs <container-id>
```

### 4. API 엔드포인트 테스트
```bash
# Health check
curl http://localhost:3000/api/health

# 예상 응답
# {"ollama":true,"docker":true,"models":["gemma3:27b"]}
```

---

## 성능 최적화

### Docker 이미지 사전 다운로드
```bash
# 모든 이미지 미리 다운로드 (선택사항)
docker pull python:3.11-slim
docker pull node:20-slim
docker build -t local-sandbox-python ./docker/python
```

### Ollama 모델 캐싱
- 자주 사용하는 모델을 미리 다운로드
- `ollama pull gemma3:12b` (더 가벼운 모델)

---

## 문제 해결 체크리스트

- [ ] Docker Desktop이 실행 중인가?
- [ ] 상단 헤더에서 "Docker ✓" 표시되는가?
- [ ] Ollama가 실행 중인가? (포트 11434)
- [ ] 필요한 Docker 이미지가 빌드되었는가?
- [ ] 브라우저 콘솔에 에러가 없는가?
- [ ] 서버 로그에 에러가 없는가?
