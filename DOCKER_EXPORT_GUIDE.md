# Docker 이미지 내보내기 및 가져오기 가이드

## 방법 1: Docker Save/Load (추천) ⭐

가장 간단하고 안전한 방법입니다.

### 📤 내보내기 (현재 컴퓨터)

```bash
# 1. 현재 이미지 확인
docker images | grep local-fragments

# 2. Python 이미지 내보내기
docker save -o local-fragments-python.tar local-fragments-python:latest

# 3. Node 이미지 내보내기
docker save -o local-fragments-node.tar local-fragments-node:latest

# 4. (선택) 압축하여 용량 줄이기
gzip local-fragments-python.tar
gzip local-fragments-node.tar
# 결과: local-fragments-python.tar.gz, local-fragments-node.tar.gz
```

### 📥 가져오기 (다른 컴퓨터)

```bash
# 1. tar 파일 복사 (USB, 네트워크 등으로)

# 2. 압축된 경우 압축 해제
gunzip local-fragments-python.tar.gz
gunzip local-fragments-node.tar.gz

# 3. 이미지 로드
docker load -i local-fragments-python.tar
docker load -i local-fragments-node.tar

# 4. 이미지 확인
docker images | grep local-fragments
```

### 파일 크기 예상

- Python 이미지 (matplotlib 포함): ~500-800 MB
- Node 이미지: ~200-300 MB
- 압축 후: 약 50-60% 감소

---

## 방법 2: 한 번에 모든 이미지 내보내기

```bash
# 모든 local-fragments 이미지를 하나의 파일로
docker save -o local-fragments-all.tar \
  local-fragments-python:latest \
  local-fragments-node:latest

# 압축
gzip local-fragments-all.tar

# 다른 컴퓨터에서 가져오기
gunzip -c local-fragments-all.tar.gz | docker load
```

---

## 방법 3: 프로젝트 전체 복사 (Dockerfile 포함)

소스 코드와 함께 옮기는 방법입니다.

### 장점
- 버전 관리 가능
- 이미지 수정 및 재빌드 가능
- 파일 크기가 훨씬 작음 (수 MB)

### 단점
- 다른 컴퓨터에서 빌드 시간 필요 (5-10분)
- 인터넷 연결 필요 (패키지 다운로드)

### 방법

```bash
# 1. 현재 컴퓨터에서 프로젝트 압축
# (Git을 사용하지 않는 경우)
cd d:\Python
Compress-Archive -Path local-fragments -DestinationPath local-fragments-source.zip

# 2. 다른 컴퓨터로 복사 후 압축 해제

# 3. 다른 컴퓨터에서 빌드
cd local-fragments
docker-compose build

# 또는 개별 빌드
docker build -t local-fragments-python:latest -f docker/python/Dockerfile .
docker build -t local-fragments-node:latest -f docker/node/Dockerfile .
```

---

## 방법 4: Docker Registry 사용

### 로컬 네트워크에서 공유

```bash
# === 서버 컴퓨터 (이미지가 있는 곳) ===

# 1. 로컬 레지스트리 실행
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# 2. 이미지 태그 추가
docker tag local-fragments-python:latest localhost:5000/local-fragments-python:latest
docker tag local-fragments-node:latest localhost:5000/local-fragments-node:latest

# 3. 레지스트리에 푸시
docker push localhost:5000/local-fragments-python:latest
docker push localhost:5000/local-fragments-node:latest

# 4. 서버 IP 확인
ipconfig  # Windows
# 예: 192.168.1.100

# === 클라이언트 컴퓨터 (이미지를 받을 곳) ===

# 5. 이미지 다운로드 (같은 네트워크에서)
docker pull 192.168.1.100:5000/local-fragments-python:latest
docker pull 192.168.1.100:5000/local-fragments-node:latest

# 6. 태그 변경 (선택)
docker tag 192.168.1.100:5000/local-fragments-python:latest local-fragments-python:latest
docker tag 192.168.1.100:5000/local-fragments-node:latest local-fragments-node:latest
```

---

## 방법 5: Docker Hub 사용 (인터넷 필요)

### 공개 또는 비공개 저장소로 공유

```bash
# 1. Docker Hub 로그인
docker login

# 2. 이미지 태그 추가 (your-username을 본인 Docker Hub ID로 변경)
docker tag local-fragments-python:latest your-username/local-fragments-python:latest
docker tag local-fragments-node:latest your-username/local-fragments-node:latest

# 3. Docker Hub에 푸시
docker push your-username/local-fragments-python:latest
docker push your-username/local-fragments-node:latest

# === 다른 컴퓨터에서 ===

# 4. 이미지 다운로드
docker pull your-username/local-fragments-python:latest
docker pull your-username/local-fragments-node:latest

# 5. 태그 변경
docker tag your-username/local-fragments-python:latest local-fragments-python:latest
docker tag your-username/local-fragments-node:latest local-fragments-node:latest
```

**참고**: 비공개 저장소는 Docker Hub 유료 플랜 필요

---

## 빠른 참조

| 방법 | 장점 | 단점 | 추천 상황 |
|------|------|------|----------|
| **Save/Load** | 간단, 오프라인 가능 | 파일 크기 큼 (500MB+) | USB/외장하드로 이동 |
| **프로젝트 복사** | 파일 작음, 버전 관리 | 빌드 시간 필요 | Git 사용, 수정 필요 |
| **로컬 Registry** | 네트워크로 빠른 전송 | 같은 네트워크 필요 | 회사/집 내부 공유 |
| **Docker Hub** | 어디서나 접근 | 인터넷 필요, 공개 위험 | 원격 협업 |

---

## 실전 시나리오

### 시나리오 1: 회사 → 집 (오프라인)

```bash
# 회사 컴퓨터
docker save local-fragments-python local-fragments-node | gzip > images.tar.gz
# USB에 복사

# 집 컴퓨터
gunzip -c images.tar.gz | docker load
```

### 시나리오 2: 개발 서버 → 운영 서버 (네트워크)

```bash
# 개발 서버
docker save local-fragments-python local-fragments-node | ssh user@prod-server docker load
```

### 시나리오 3: 팀원과 공유 (Git)

```bash
# 개발자 A
git add .
git commit -m "Add local-fragments project"
git push

# 개발자 B
git clone <repository>
cd local-fragments
docker-compose build
```

---

## 문제 해결

### Q: "no space left on device" 에러
```bash
# Docker 정리
docker system prune -a
```

### Q: 이미지 로드 후 실행 안됨
```bash
# 이미지 이름 확인
docker images

# 필요시 태그 변경
docker tag <image-id> local-fragments-python:latest
```

### Q: Windows에서 .tar.gz 압축/해제
```bash
# PowerShell에서
# 압축
docker save local-fragments-python | gzip > python.tar.gz

# 해제
gunzip -c python.tar.gz | docker load
```

---

## 추천 워크플로우

### 처음 설정할 때 (한 번만)
1. 프로젝트를 Git에 커밋
2. GitHub/GitLab에 푸시

### 다른 컴퓨터에서
1. Git clone
2. `docker-compose build`

### 빌드 시간을 절약하려면
1. `docker save`로 이미지 저장
2. USB/클라우드로 전송
3. `docker load`로 로드

---

**핵심 요약**:
- **오프라인 이동**: `docker save` → USB → `docker load`
- **온라인 공유**: Docker Hub 또는 Git + rebuild
- **네트워크 전송**: 로컬 Registry
