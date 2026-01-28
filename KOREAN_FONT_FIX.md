# 한글 폰트 깨짐 문제 해결

Python Chart에서 한글이 깨지는 문제를 해결하는 가이드입니다.

## 문제 증상

matplotlib 차트에서 한글이 네모(□)로 표시됩니다.

## 해결 방법

### 1. Docker 이미지 재빌드 (필수)

한글 폰트가 포함된 새 Docker 이미지를 빌드해야 합니다.

```bash
# 기존 이미지 삭제 (선택사항)
docker rmi local-sandbox-python

# 새 이미지 빌드
docker build -t local-sandbox-python ./docker/python
```

빌드 시간: 약 2-3분 소요

### 2. 이미지 확인

```bash
# 이미지 확인
docker images | grep local-sandbox-python

# 폰트 설치 확인
docker run --rm local-sandbox-python fc-list | grep -i nanum
```

예상 출력:
```
/usr/share/fonts/truetype/nanum/NanumGothic.ttf: NanumGothic:style=Regular
/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf: NanumGothic:style=Bold
```

## 적용된 수정사항

### 1. Dockerfile 수정
- **나눔 폰트 설치**: `fonts-nanum`, `fonts-nanum-coding`, `fonts-nanum-extra`
- **fontconfig 설치**: 폰트 캐시 생성
- **matplotlib 설정 파일**: 한글 폰트 자동 사용

### 2. matplotlibrc 설정 파일 추가
```
font.family: NanumGothic, DejaVu Sans, sans-serif
axes.unicode_minus: False
```

### 3. 시스템 프롬프트 개선
AI가 Python Chart 코드 생성 시 자동으로 한글 폰트 설정을 포함하도록 수정:
```python
import matplotlib.pyplot as plt
plt.rcParams['font.family'] = 'NanumGothic'
plt.rcParams['axes.unicode_minus'] = False
```

## 테스트

이미지 빌드 후 테스트:

```
프롬프트: "월별 매출 데이터로 막대 차트 만들어줘"
템플릿: Python Chart
```

**예상 결과**:
- 제목: "월별 매출"
- X축: "월"
- Y축: "매출"
- 모든 한글이 정상적으로 표시됨

## 트러블슈팅

### 문제: 여전히 한글이 깨짐

1. **이미지 재빌드 확인**
   ```bash
   docker images local-sandbox-python
   ```
   - 빌드 날짜가 최신인지 확인

2. **이미지 강제 재빌드**
   ```bash
   docker build --no-cache -t local-sandbox-python ./docker/python
   ```

3. **실행 중인 컨테이너 확인**
   ```bash
   docker ps -a | grep sandbox
   # 오래된 컨테이너 삭제
   docker rm $(docker ps -a -q -f name=sandbox)
   ```

### 문제: 빌드 중 에러

1. **Docker Desktop 실행 확인**
   - Windows: Docker Desktop이 실행 중인지 확인

2. **인터넷 연결 확인**
   - apt-get과 pip가 패키지를 다운로드해야 함

3. **디스크 공간 확인**
   ```bash
   docker system df
   ```

## 지원되는 폰트

Docker 이미지에 포함된 한글 폰트:
- **NanumGothic** (기본)
- **NanumGothicBold**
- **NanumBarunGothic**
- **NanumMyeongjo**
- **NanumGothicCoding**

## 추가 폰트 사용

다른 폰트를 사용하려면 Dockerfile을 수정:

```dockerfile
# 예: Ubuntu 폰트 추가
RUN apt-get update && apt-get install -y \
    fonts-nanum \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    && fc-cache -fv
```

그 후 matplotlibrc 수정:
```
font.family: Noto Sans CJK KR, NanumGothic, sans-serif
```

## 성능 영향

- **이미지 크기**: 약 100MB 증가 (폰트 파일 포함)
- **빌드 시간**: 약 2-3분 추가
- **실행 시간**: 변화 없음

## 참고

- matplotlib 한글 폰트 설정: https://matplotlib.org/stable/tutorials/text/text_props.html
- 나눔 폰트: https://hangeul.naver.com/font
- Docker 이미지 최적화: https://docs.docker.com/develop/dev-best-practices/
