# HTML 이미지 사용 가이드

## 문제: 이미지가 깨져서 표시됨 (빨간 테두리 박스)

HTML 템플릿에서 AI가 생성한 이미지가 깨지는 이유와 해결 방법입니다.

---

## 🔴 문제 원인

### 1. 존재하지 않는 URL
```html
<!-- ❌ 작동하지 않음 -->
<img src="https://source.unsplash.com/random/300x200">
<img src="https://example.com/product.jpg">
<img src="./images/logo.png">
```

AI가 생성한 이미지 URL이:
- 실제로 존재하지 않는 경로
- 무작위 이미지 서비스 (Unsplash random 등)가 차단됨
- 로컬 파일 경로 (접근 불가)

### 2. CORS 정책
일부 이미지 서버에서 외부 접근을 차단합니다.

---

## ✅ 해결 방법

### 방법 1: CSS로만 디자인 (권장) ⭐

이미지 대신 CSS를 사용하여 시각적 요소를 만듭니다.

#### 예시 프롬프트:
```
SaaS 랜딩 페이지를 만들어줘.
이미지 대신 그라데이션 배경과 CSS 아이콘을 사용해서.
히어로 섹션, 기능 카드 3개, 가격 테이블 포함.
```

**장점**:
- 항상 작동
- 빠른 로딩
- 완전한 커스터마이징 가능

#### CSS 대체 기술:

**1. 그라데이션 배경**
```css
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**2. CSS 모양**
```css
.icon {
  width: 50px;
  height: 50px;
  background: #4F46E5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**3. Box Shadow 효과**
```css
.card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
```

---

### 방법 2: 인라인 SVG 사용

SVG를 HTML에 직접 포함합니다.

#### 예시 프롬프트:
```
대시보드 UI를 만들어줘.
아이콘은 SVG로 직접 만들어서 포함해줘.
통계 카드 4개, 간단한 아이콘 (✓, ✗, ↑, $) 사용.
```

#### SVG 예시:
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" fill="#4F46E5"/>
  <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2"/>
</svg>
```

**장점**:
- 벡터 그래픽 (확대해도 선명)
- CSS로 색상 변경 가능
- 외부 파일 불필요

---

### 방법 3: Placeholder 이미지 서비스

실제 작동하는 placeholder 서비스 사용.

#### 사용 가능한 서비스:

**1. via.placeholder.com** (권장)
```html
<!-- ✅ 작동함 -->
<img src="https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Logo">
```

형식: `https://via.placeholder.com/너비x높이/배경색/텍스트색?text=텍스트`

**2. dummyimage.com**
```html
<img src="https://dummyimage.com/300x200/4F46E5/fff&text=Product">
```

#### 예시 프롬프트:
```
제품 갤러리를 만들어줘.
제품 이미지는 https://via.placeholder.com/300x200 사용.
6개 그리드 레이아웃, 호버 효과.
```

---

### 방법 4: 이모지 사용

텍스트 이모지로 아이콘 대체.

```html
<div class="icon">📊</div>
<div class="icon">🚀</div>
<div class="icon">💎</div>
```

#### 예시 프롬프트:
```
기능 소개 카드 4개를 만들어줘.
아이콘은 이모지 사용 (💡, 🎯, 🔒, ⚡).
```

**장점**:
- 즉시 사용 가능
- 다양한 스타일
- 크기 조절 간단

---

## 📋 템플릿별 권장 방법

| 요구사항 | 권장 방법 | 예시 |
|---------|----------|------|
| 로고/브랜딩 | CSS 그라데이션 | `background: linear-gradient(...)` |
| 아이콘 | 이모지 또는 SVG | 📊, ✓, 🚀 |
| 제품 이미지 | CSS 카드 + 텍스트 | 색상 배경 + 제품명 |
| 배경 이미지 | CSS 그라데이션 | `radial-gradient(...)` |
| 프로필 사진 | CSS 원형 + 이니셜 | 배경색 + "JD" |
| 일러스트 | SVG 도형 | `<svg>` 태그 |

---

## 🎨 프롬프트 작성 예시

### ❌ 이미지가 깨질 수 있는 프롬프트

```
제품 카탈로그를 만들어줘.
제품 사진 6개, 각 제품마다 이미지 포함.
```
→ AI가 존재하지 않는 이미지 URL 생성 → 빨간 테두리 박스

### ✅ 올바른 프롬프트

**방법 1: CSS만 사용**
```
제품 카탈로그를 만들어줘.
제품 카드 6개, 이미지 대신 그라데이션 배경 사용.
각 카드마다 다른 색상 조합.
```

**방법 2: 이모지 사용**
```
제품 카탈로그를 만들어줘.
카테고리별 이모지 아이콘 (📱, 💻, ⌚, 🎧, 📷, 🎮).
```

**방법 3: SVG 사용**
```
기능 카드 4개를 만들어줘.
각 카드에 간단한 SVG 아이콘 직접 포함.
체크마크, X표시, 화살표, 별 모양.
```

**방법 4: Placeholder 사용**
```
포트폴리오 갤러리를 만들어줘.
프로젝트 썸네일은 https://via.placeholder.com/400x300 사용.
6개 그리드, 호버 효과.
```

---

## 🔧 기존 HTML 수정하기

이미 생성된 HTML에서 이미지가 깨졌다면:

### 1. Source 보기
우측 프리뷰에서 "Source" 버튼 클릭

### 2. 이미지 태그 찾기
```html
<img src="broken-url.jpg" alt="Product">
```

### 3. CSS로 교체
```html
<div class="product-placeholder" style="
  width: 300px;
  height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
">
  📦
</div>
```

---

## 💡 프로 팁

### 1. 색상 선택
```
메인 색상: #4F46E5 (인디고)
보조 색상: #EC4899 (핑크)
그라데이션: linear-gradient(135deg, #4F46E5, #EC4899)
```

### 2. 글래스모피즘 효과
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 3. 네온 글로우
```css
.neon {
  box-shadow: 0 0 20px #4F46E5,
              0 0 40px #4F46E5;
}
```

### 4. 카드 호버 효과
```css
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}
```

---

## 🎯 실전 예제

### 예제 1: 이미지 없는 제품 카드

**프롬프트**:
```
이커머스 제품 카드 6개를 만들어줘.
이미지 영역은 그라데이션 배경 + 제품 카테고리 이모지.
제품명, 가격, 구매 버튼 포함.
```

**결과**:
- 각 카드마다 다른 그라데이션
- 이모지 아이콘 (📱, 💻, ⌚, 🎧, 📷, 🎮)
- 100% 작동, 이미지 깨짐 없음

### 예제 2: 프로필 카드

**프롬프트**:
```
팀 멤버 소개 카드 4개를 만들어줘.
프로필 사진 대신 원형 배경 + 이니셜 표시.
각자 다른 배경 색상, 이름, 직책, 이메일 포함.
```

### 예제 3: 랜딩 페이지

**프롬프트**:
```
SaaS 제품 랜딩 페이지를 만들어줘.
히어로 섹션: 그라데이션 배경 + 큰 헤드라인
기능 카드 3개: SVG 아이콘 + 설명
가격 테이블: 3단계 (Basic, Pro, Enterprise)
모든 시각 요소는 CSS로만 구현.
```

---

## 📊 방법 비교

| 방법 | 장점 | 단점 | 추천도 |
|------|------|------|--------|
| CSS 그라데이션 | 항상 작동, 빠름 | 실사 불가 | ⭐⭐⭐⭐⭐ |
| SVG | 선명, 커스텀 | 복잡할 수 있음 | ⭐⭐⭐⭐ |
| 이모지 | 간단, 다양 | 폰트 의존 | ⭐⭐⭐⭐ |
| Placeholder | 실제 이미지 비슷 | 외부 의존 | ⭐⭐⭐ |
| 외부 URL | - | 작동 안함 | ❌ |

---

## 🚫 절대 사용하지 말 것

```html
<!-- ❌ 작동하지 않음 -->
<img src="https://source.unsplash.com/random/300x200">
<img src="https://picsum.photos/300/200">
<img src="./assets/image.jpg">
<img src="image.png">
<img src="https://example.com/photo.jpg">
```

이런 URL들은 모두 빨간 테두리 박스로 표시됩니다.

---

## 📚 관련 문서

- **메인 가이드**: [README.md](README.md)
- **예제 프롬프트**: [EXAMPLE_PROMPTS.md](EXAMPLE_PROMPTS.md)
- **문제 해결**: [TESTING.md](TESTING.md)

---

**핵심 요약**: 이미지 대신 CSS를 사용하세요! 그라데이션, SVG, 이모지면 충분합니다. 🎨
