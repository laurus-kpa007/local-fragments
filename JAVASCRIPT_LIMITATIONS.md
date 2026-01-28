# JavaScript 템플릿 제한사항

## 개요

JavaScript (Node.js) 템플릿은 **Node.js 내장 모듈만** 사용할 수 있습니다. 외부 npm 패키지는 사용할 수 없습니다.

## 사용 가능한 모듈

### ✅ 사용 가능 (Node.js 내장 모듈)

| 모듈 | 용도 | 예시 |
|------|------|------|
| `fs` | 파일 시스템 | 파일 읽기/쓰기 |
| `path` | 경로 처리 | 경로 조합, 확장자 추출 |
| `crypto` | 암호화 | 해시, 암호화/복호화 |
| `http`/`https` | HTTP 요청 | 간단한 서버, API 호출 |
| `url` | URL 파싱 | URL 구조 분석 |
| `os` | 운영체제 정보 | 시스템 정보 조회 |
| `util` | 유틸리티 | 프로미스, 포맷팅 |
| `stream` | 스트림 처리 | 데이터 스트리밍 |
| `events` | 이벤트 에미터 | 이벤트 기반 처리 |
| `buffer` | 버퍼 처리 | 바이너리 데이터 |
| `querystring` | 쿼리스트링 | URL 파라미터 파싱 |
| `zlib` | 압축 | gzip, deflate |

전체 목록: https://nodejs.org/api/

### ❌ 사용 불가 (외부 npm 패키지)

| 패키지 | 대체 방안 |
|--------|-----------|
| `express` | HTML 템플릿 사용 또는 내장 `http` 모듈 |
| `axios` | 내장 `https` 모듈 또는 `fetch` API (Node 18+) |
| `lodash` | 순수 JavaScript로 구현 |
| `moment` | 내장 `Date` 객체 |
| `dotenv` | 환경변수는 직접 전달 |

## 사용 예시

### ✅ 올바른 사용

#### 1. 파일 해시 계산
```javascript
const crypto = require('crypto');
const fs = require('fs');

const data = 'Hello World';
const hash = crypto.createHash('sha256').update(data).digest('hex');
console.log('SHA256:', hash);
```

#### 2. JSON 파싱 및 포맷팅
```javascript
const data = {
  name: '홍길동',
  age: 30,
  city: '서울'
};

console.log(JSON.stringify(data, null, 2));
```

#### 3. URL 파싱
```javascript
const url = require('url');

const parsed = url.parse('https://example.com/path?name=홍길동&age=30');
console.log('Host:', parsed.host);
console.log('Path:', parsed.pathname);
```

### ❌ 잘못된 사용

#### 1. Express 사용 (불가능)
```javascript
// ❌ 이렇게 하면 에러 발생
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});
```

**대체 방안**:
- **HTML 템플릿** 사용 (웹 페이지/앱을 만들 때)
- 내장 `http` 모듈 사용 (간단한 서버)

#### 2. Axios 사용 (불가능)
```javascript
// ❌ 이렇게 하면 에러 발생
const axios = require('axios');
const response = await axios.get('https://api.example.com');
```

**대체 방안**:
```javascript
// ✅ 내장 https 모듈 사용
const https = require('https');

https.get('https://api.example.com', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
```

또는 Node.js 18+의 fetch API:
```javascript
// ✅ fetch API 사용 (Node 18+)
fetch('https://api.example.com')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 웹 앱 개발

웹 애플리케이션(UI가 있는 앱)을 만들 때는 **JavaScript 템플릿 대신 HTML 템플릿**을 사용하세요.

### JavaScript 템플릿 vs HTML 템플릿

| 요구사항 | 추천 템플릿 | 이유 |
|----------|-------------|------|
| 법인카드 사용 품의 앱 | **HTML** | UI가 필요하므로 |
| 투두 리스트 앱 | **HTML** | 인터랙티브 UI 필요 |
| 계산기 앱 | **HTML** | 버튼과 입력 필요 |
| 데이터 처리/변환 | **JavaScript** | 순수 로직만 필요 |
| API 호출 및 파싱 | **JavaScript** | 서버 사이드 로직 |
| 파일 처리 | **JavaScript** | 파일 시스템 작업 |

### HTML 템플릿 예시

**프롬프트**: "법인카드 사용 품의 앱을 만들어줘"
**템플릿**: HTML/CSS

결과:
- 완전한 웹 앱 (HTML + CSS + JavaScript)
- 폼 입력, 버튼, 테이블 등 모든 UI 요소
- 외부 의존성 없음

## 실용적인 JavaScript 템플릿 사용 사례

JavaScript 템플릿은 다음과 같은 작업에 적합합니다:

1. **데이터 처리**
   - JSON 변환 및 포맷팅
   - CSV 파싱
   - 텍스트 처리

2. **암호화/보안**
   - 비밀번호 해싱
   - 데이터 암호화
   - 토큰 생성

3. **파일 작업**
   - 파일 읽기/쓰기
   - 디렉토리 탐색
   - 파일 압축

4. **알고리즘**
   - 정렬, 검색
   - 수학 계산
   - 문자열 처리

## 에러 해결

### 에러: "Cannot find module 'express'"

**원인**: 외부 npm 패키지를 사용하려고 시도

**해결**:
1. HTML 템플릿으로 전환 (웹 앱인 경우)
2. Node.js 내장 모듈만 사용하도록 코드 수정
3. 프롬프트에 "Node.js 내장 모듈만 사용해서" 추가

### 에러: "MODULE_NOT_FOUND"

**해결**:
```
프롬프트: "[원래 프롬프트]를 Node.js 내장 모듈만 사용해서 만들어줘"
```

## 템플릿 선택 가이드

```
질문하기: "무엇을 만들고 싶으신가요?"

├─ UI가 필요한가? (버튼, 입력, 화면)
│  ├─ YES → HTML 템플릿 사용
│  └─ NO → 아래 계속
│
├─ 차트/그래프가 필요한가?
│  ├─ YES → Python Chart 템플릿
│  └─ NO → 아래 계속
│
├─ 다이어그램이 필요한가?
│  ├─ YES → Mermaid 템플릿
│  └─ NO → 아래 계속
│
└─ 데이터 처리/로직만 필요
   ├─ Python이 익숙 → Python 템플릿
   └─ JavaScript가 익숙 → JavaScript 템플릿
```

## 요약

- ✅ **JavaScript 템플릿**: Node.js 내장 모듈만 사용 가능
- ✅ **HTML 템플릿**: 웹 앱, UI가 필요할 때
- ✅ **Python 템플릿**: 모든 표준 라이브러리 + numpy, pandas 등
- ❌ **JavaScript 템플릿으로 웹 앱 만들기**: 불가능 (HTML 템플릿 사용)

## 참고 링크

- Node.js 내장 모듈 문서: https://nodejs.org/api/
- HTML 템플릿 가이드: [README.md](README.md#html-css)
- Docker 이미지 커스터마이징: [TESTING.md](TESTING.md)
