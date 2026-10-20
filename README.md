# 문제 출제실 (내신 문제 생성기)

교과서·프린트를 넣으면 과목별 내신 시험지·학습지를 만들고, 2차 검수, 학습지 풀기(펜슬 필기·채점·풀이 점검),
지난 문제, 오답노트, 푼 문제 달력까지 한곳에서 쓰는 **정적 웹사이트**입니다.

- 사이트: https://yanbek1.github.io/exam-maker/
- 원본: Claude 아티팩트 「문제 출제실」. 이 저장소의 `index.html`은 그 원본으로 `build_site.py`가 만든 것입니다.

## 웹사이트판이 아티팩트와 다른 점

| | Claude 아티팩트 | 이 웹사이트 |
|---|---|---|
| 문제 생성 | Claude 계정 사용량 | **각자의 Anthropic API 키** (왼쪽 아래 🔑, 사용한 만큼 요금) |
| 저장(지난 문제·필기·달력) | Claude 저장소 | **이 브라우저의 IndexedDB** — 기기·브라우저마다 따로, 사이트 데이터를 지우면 사라짐 |
| 키 보관 | — | 이 브라우저 localStorage에만. 서버가 없어 어디에도 보내지 않음(Anthropic API 호출 제외) |

호환층은 `claude-shim.js` 하나입니다: `claude.use("sample" | "db" | "user" | "downloads")`를
Anthropic Messages API(스트리밍)·IndexedDB·파일 내려받기로 바꿔 줍니다. 아티팩트 안에서는 아무것도 하지 않습니다.

## 고치는 법

1. 아티팩트 원본(`문제 생성기/daechi-examroom.html`)을 고친다.
2. `python3 build_site.py` → `index.html` 다시 만들기.
3. 커밋하고 `main`에 푸시하면 GitHub Pages가 몇 분 안에 반영합니다.

## 그 밖

- `v1/` — 예전 첫 버전(단순 생성기). https://yanbek1.github.io/exam-maker/v1/
- 생성된 문제는 원본 자료와 대조해 검토한 뒤 사용하세요.
