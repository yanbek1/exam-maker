# 내신 문제 생성기

학습 자료(PDF·이미지·텍스트)를 업로드하면 고난도 내신형 시험지 + 정답·해설지를 자동으로 만들어 주는 **완전 정적 웹사이트**입니다. 백엔드 없이 브라우저에서 Anthropic Claude API를 직접 호출합니다.

## 기능

- PDF / 이미지(JPG·PNG·WebP·GIF) / 텍스트 파일 업로드 (드래그 앤 드롭 지원) 또는 텍스트 붙여넣기
- 업로드한 자료 내용만으로 고난도 내신형 5지선다 문항 출제 (문항 수·난이도·추가 요청 설정 가능)
- 실제 내신 시험지 스타일 레이아웃:
  - A4 세로 2단 다단 구성
  - 굵은 초록색 문항 번호 (01, 02 …)
  - 모서리가 둥근 `<보기>` 박스 (라벨이 테두리 선 위에 걸치는 디자인)
  - 일반 선지는 세로 1열, ㄱㄴㄷ 고르기형은 3-2 배열
  - 해설지는 새 페이지에 분리, 상단에 초록 테마 빠른 정답 그리드, 오답 해설에 '바로알기' 캡슐 배지
- 화면 미리보기 + **PDF 저장(브라우저 인쇄)** + HTML 파일 다운로드

## 사용 방법

1. [Anthropic Console](https://console.anthropic.com/settings/keys)에서 API 키를 발급받아 1단계에 입력하고 저장 (키는 브라우저 localStorage에만 보관됩니다)
2. 학습 자료를 업로드
3. 문항 수·난이도 등을 고르고 **시험지 생성하기** 클릭
4. 결과 화면에서 **PDF로 저장(인쇄)** → 인쇄 대상에서 "PDF로 저장" 선택

API 키 없이 레이아웃만 보려면 **디자인 미리보기(샘플)** 버튼을 누르세요.

## GitHub Pages 배포

```bash
cd exam-maker
git init
git add .
git commit -m "내신 문제 생성기"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

그다음 GitHub 저장소 → **Settings → Pages → Source: Deploy from a branch → main / (root)** 선택.
몇 분 뒤 `https://<사용자명>.github.io/<저장소명>/` 에서 접속할 수 있습니다.

## 파일 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 페이지 구조 (업로드 UI, 옵션, 미리보기) |
| `style.css` | 사이트 UI 스타일 |
| `app.js` | 파일 처리, Claude API 스트리밍 호출, 시험지 렌더링·다운로드. 시험지 인쇄용 CSS(`EXAM_CSS`)와 출제 프롬프트(`buildSystemPrompt`)도 여기에 있습니다 |

## 주의

- API 사용량에 따라 Anthropic 요금이 부과됩니다 (자료 분량·문항 수에 비례).
- 공용 컴퓨터에서는 사용 후 API 키를 지우세요 (localStorage에 저장됨).
- 생성된 문제는 반드시 원본 자료와 대조해 검토 후 사용하세요.
