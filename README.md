# Local Fragments

E2B 없이 완전 로컬에서 동작하는 AI 코드 생성 + 실행 프리뷰 도구입니다.

![Local Fragments](https://img.shields.io/badge/Ollama-Local%20LLM-blue)
![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED)
![No Cloud](https://img.shields.io/badge/Cloud-Not%20Required-green)

## 특징

- **완전 로컬**: 외부 API 키 불필요, E2B 의존성 없음
- **Ollama 연동**: Gemma3, Llama, Mistral 등 로컬 LLM 사용
- **Docker 샌드박스**: 안전한 코드 실행 환경
- **실시간 프리뷰**: HTML, 차트, 다이어그램 즉시 확인

## 지원 템플릿

| 템플릿 | 설명 | Docker 필요 |
|--------|------|-------------|
| 🌐 HTML/CSS | 웹 페이지 생성 | ❌ |
| 🐍 Python | 스크립트 실행 | ✅ |
| 📊 Python Chart | 데이터 시각화 | ✅ |
| ⚡ JavaScript | Node.js 실행 | ✅ |
| 📐 Mermaid | 다이어그램 생성 | ❌ |

## 요구사항

### 필수
- Node.js 18+
- Ollama (로컬 LLM 서버)

### 선택 (Python/Node 실행 시)
- Docker Desktop

## 빠른 시작

### 1. Ollama 설치 및 모델 다운로드

```bash
# Ollama 설치 (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# 모델 다운로드 (권장: gemma3:27b 또는 더 작은 모델)
ollama pull gemma3:27b
# 또는 더 가벼운 모델
ollama pull gemma3:12b
ollama pull llama3.2:latest

# Ollama 서버 실행
ollama serve
```

### 2. 프로젝트 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 3. (선택) Docker 샌드박스 이미지 빌드

Python/Node.js 코드 실행이 필요한 경우:

```bash
# Python 샌드박스 이미지 빌드 (한글 폰트 포함)
docker build -t local-sandbox-python ./docker/python

# Node.js 샌드박스 이미지 빌드
docker build -t local-sandbox-node ./docker/node
```

**참고**: Python Chart 템플릿에서 한글이 정상적으로 표시됩니다.
- 나눔 폰트 자동 설정
- matplotlib 한글 지원
- 자세한 내용: [KOREAN_FONT_FIX.md](KOREAN_FONT_FIX.md)

### 4. 브라우저에서 접속

```
http://localhost:3000
```

## 환경 변수

`.env.local` 파일을 생성하고 필요에 따라 수정:

```bash
# Ollama 서버 URL (기본: localhost)
OLLAMA_URL=http://localhost:11434

# 기본 모델 (Ollama에서 사용 가능한 모델)
DEFAULT_MODEL=gemma3:27b

# Docker 소켓 경로
DOCKER_HOST=unix:///var/run/docker.sock

# 실행 시간 제한 (ms)
MAX_EXECUTION_TIME=30000

# 메모리 제한 (MB)
MAX_MEMORY_MB=512
```

## 사용 예시

### HTML 페이지 생성
```
프롬프트: "로그인 폼 만들어줘. 이메일, 비밀번호 입력창과 로그인 버튼"
템플릿: HTML/CSS
→ 즉시 프리뷰 표시
```

### 차트 생성 (Docker 필요)
```
프롬프트: "월별 매출 데이터로 막대 차트 만들어줘"
템플릿: Python Chart
→ matplotlib 차트 이미지 생성
```

### 다이어그램 생성
```
프롬프트: "사용자 인증 플로우 시퀀스 다이어그램"
템플릿: Mermaid
→ 다이어그램 렌더링
```

## 프로젝트 구조

```
local-fragments/
├── app/
│   ├── api/
│   │   ├── generate/     # 코드 생성 API
│   │   ├── execute/      # 코드 실행 API
│   │   └── health/       # 상태 체크 API
│   ├── page.tsx          # 메인 UI
│   └── globals.css
├── components/
│   ├── CodeEditor.tsx    # 코드 에디터
│   ├── ResultPreview.tsx # 결과 프리뷰
│   ├── TemplateSelector.tsx
│   ├── ModelSelector.tsx
│   └── StatusIndicator.tsx
├── lib/
│   ├── ollama.ts         # Ollama 클라이언트
│   ├── docker.ts         # Docker 실행 로직
│   └── types.ts          # 타입 정의
├── docker/
│   ├── python/Dockerfile # Python 샌드박스
│   └── node/Dockerfile   # Node.js 샌드박스
└── docker-compose.yml    # Docker Compose 설정
```

## 트러블슈팅

### Ollama 연결 실패
```bash
# Ollama 상태 확인
curl http://localhost:11434/api/tags

# Ollama 재시작
ollama serve
```

### Docker 권한 오류
```bash
# Docker 소켓 권한 확인
sudo chmod 666 /var/run/docker.sock

# 또는 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
```

### 모델 응답이 느림
- 더 작은 모델 사용: `gemma3:12b` 또는 `llama3.2:3b`
- GPU 사용 확인: `ollama ps`로 GPU 사용 여부 확인

## 원격 Ollama 연결

다른 서버의 Ollama에 연결하려면:

```bash
# .env.local
OLLAMA_URL=http://192.168.1.100:11434
```

원격 Ollama 서버에서:
```bash
# 외부 접속 허용
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

## 라이선스

MIT License

## 크레딧

- [E2B Fragments](https://github.com/e2b-dev/fragments) - 원본 영감
- [Ollama](https://ollama.ai) - 로컬 LLM 서버
- [Mermaid](https://mermaid.js.org) - 다이어그램 렌더링
