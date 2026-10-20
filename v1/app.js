/* ==========================================================================
   내신 문제 생성기 — 프론트엔드 전용 (GitHub Pages 정적 사이트)
   브라우저에서 Anthropic Claude API를 직접 호출합니다.
   ========================================================================== */

"use strict";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB 권장 한도

/* ---------- 시험지 인쇄용 CSS (A4 · 2단 · 초록 테마) ---------- */
const EXAM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

:root {
  --green: #1b7a43;
  --green-dark: #146034;
  --green-light: #e8f5ee;
}

* { box-sizing: border-box; }

@page { size: A4; margin: 14mm 12mm; }

html, body {
  margin: 0; padding: 0;
  font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #1a1a1a;
  background: #fff;
}

@media screen {
  body { background: #e9ecea; padding: 24px 0; }
  .sheet {
    width: 210mm; min-height: 297mm; margin: 0 auto 24px;
    background: #fff; padding: 14mm 12mm;
    box-shadow: 0 2px 12px rgba(0,0,0,.18);
  }
}
@media print {
  .sheet { width: auto; padding: 0; box-shadow: none; }
}

/* ----- 시험지 머리글 ----- */
.exam-header {
  border: 2.5px solid var(--green);
  border-radius: 10px;
  padding: 12px 18px 10px;
  text-align: center;
  margin-bottom: 14px;
}
.exam-header h1 { margin: 0; font-size: 16pt; font-weight: 900; letter-spacing: -.5px; }
.exam-header .exam-info {
  margin-top: 4px; font-size: 9pt; color: #444;
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.exam-header .name-line { border-top: 1px dashed #bbb; margin-top: 8px; padding-top: 6px;
  font-size: 9pt; color: #333; display:flex; gap: 24px; justify-content: flex-end; }

/* ----- 본문 2단 다단 ----- */
.exam-body {
  column-count: 2;
  column-gap: 9mm;
  column-rule: 1px solid #c9d4cd;
}

/* ----- 문항 ----- */
.question {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  margin-bottom: 18px;
}
.q-num {
  font-weight: 900;
  font-size: 12.5pt;
  color: var(--green);
  margin-right: 6px;
}
.q-text { display: inline; font-weight: 500; }
.q-passage {
  border: 1px solid #ccc; border-radius: 6px;
  background: #fafbfa;
  padding: 8px 10px; margin: 8px 0;
  font-size: 9.8pt;
}

/* ----- <보기> 박스 : 둥근 테두리 + 선 위에 걸친 라벨 ----- */
.boki-box {
  position: relative;
  border: 1.4px solid #333;
  border-radius: 8px;
  padding: 14px 14px 10px;
  margin: 12px 2px 10px;
}
.boki-label {
  position: absolute;
  top: -0.85em;
  left: 14px;
  background: #fff;
  padding: 0 10px;
  font-weight: 700;
  letter-spacing: 6px;
  font-size: 9.5pt;
}
.boki-box .boki-content p, .boki-box p { margin: 2px 0; }

/* ----- 선지 ----- */
ol.choices {
  list-style: none;
  margin: 8px 0 0;
  padding: 0 0 0 4px;
}
ol.choices li { margin: 3px 0; }

/* ㄱㄴㄷ 고르기형: 윗줄 3개 + 아랫줄 2개 (3-2 배열) */
ol.choices.grid32 {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 0;
}
ol.choices.grid32 li { width: 32%; margin: 2px 0; }

/* ----- 정답 및 해설 (새 페이지) ----- */
.answer-sheet {
  page-break-before: always;
  break-before: page;
}
.answer-title {
  text-align: center;
  font-size: 14pt;
  font-weight: 900;
  color: var(--green-dark);
  border-bottom: 2.5px solid var(--green);
  padding-bottom: 6px;
  margin: 0 0 12px;
}

/* 빠른 정답 박스: 가로로 긴 둥근 박스 + 초록 5칸 그리드 */
.quick-answers {
  border: 1.6px solid var(--green);
  border-radius: 14px;
  padding: 10px 14px;
  margin-bottom: 16px;
}
.qa-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.qa-cell {
  background: var(--green-light);
  border: 1px solid #bfdccb;
  border-radius: 8px;
  text-align: center;
  padding: 4px 2px;
  font-size: 10pt;
}
.qa-cell .qa-num { font-weight: 900; color: var(--green-dark); margin-right: 6px; }
.qa-cell .qa-ans { font-weight: 700; }

/* 해설 2단 다단 */
.explanations {
  column-count: 2;
  column-gap: 9mm;
  column-rule: 1px solid #c9d4cd;
  font-size: 9.6pt;
}
.exp {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  margin-bottom: 14px;
}
.exp-num {
  font-weight: 900;
  font-size: 11.5pt;
  color: var(--green);
  margin-right: 6px;
}
.exp p { margin: 4px 0; }

/* '바로알기' 캡슐 배지 */
.badge {
  display: inline-block;
  border: 1px solid #999;
  border-radius: 999px;
  padding: 0 9px;
  margin-right: 5px;
  font-size: 8.3pt;
  font-weight: 700;
  color: #555;
  background: #f4f4f4;
  vertical-align: 1px;
  white-space: nowrap;
}
`;

/* ---------- 출제 시스템 프롬프트 ---------- */
function buildSystemPrompt() {
  return `너는 지금부터 대치동 1타 강사이자 내신 출제 전문가야. 사용자가 제공하는 학습 자료(사진/텍스트/PDF 등)를 완벽하게 분석해서, 실제 고등학교 고난도 내신 시험지(EBS, 자이스토리 스타일)와 동일한 형태의 시험지를 HTML로 제작해.

[1. 문항 출제 기준]
- 오직 제공된 자료의 내용만을 100% 활용하여 출제할 것 (외부 개념 금지).
- 단순 암기가 아닌 개념 간의 비교, 원리 적용, 함정 선지가 포함된 '수능/고난도 내신형'으로 출제할 것.
- 유형: 옳은/옳지 않은 것 고르기, <보기> 적용형, 개념 융합형 등 다양하게 구성.
- 모든 문항은 5지선다(①~⑤)로 출제할 것.

[2. 출력 형식 — 매우 중요]
- 반드시 아래에 정의된 HTML 구조와 클래스명만 사용해서 출력할 것. CSS는 이미 준비되어 있으므로 <style>이나 인라인 스타일을 절대 쓰지 말 것.
- 마크다운 코드펜스(\`\`\`) 없이, 설명 없이, 아래 두 개의 <section>만 순수 HTML로 출력할 것.
- 문항 번호는 '01', '02' 형식의 두 자리로 표기.
- 선지 기호는 ①②③④⑤, 보기 항목은 ㄱ, ㄴ, ㄷ, ㄹ을 사용할 것.

=== 문제지 구조 ===
<section class="exam-body">
  <div class="question">
    <p><span class="q-num">01</span><span class="q-text">발문을 여기에 쓴다. 옳지 않은 것을 고르는 문제는 '않은'에 <u>밑줄</u>을 칠 것.</span></p>
    <!-- 지문/자료가 필요하면 (선택): -->
    <div class="q-passage">(가) ... (나) ...</div>
    <!-- <보기> 적용형이면 (선택): -->
    <div class="boki-box"><span class="boki-label">보 기</span>
      <p>ㄱ. ...</p>
      <p>ㄴ. ...</p>
      <p>ㄷ. ...</p>
    </div>
    <!-- 일반 5지선다: 세로 1열 -->
    <ol class="choices">
      <li>① ...</li><li>② ...</li><li>③ ...</li><li>④ ...</li><li>⑤ ...</li>
    </ol>
    <!-- ㄱㄴㄷ에서 고르는 유형은 반드시 grid32 클래스 사용 (윗줄 3개, 아랫줄 2개 배열): -->
    <!-- <ol class="choices grid32"><li>① ㄱ</li><li>② ㄷ</li><li>③ ㄱ, ㄴ</li><li>④ ㄴ, ㄷ</li><li>⑤ ㄱ, ㄴ, ㄷ</li></ol> -->
  </div>
  <!-- 문항 수만큼 반복 -->
</section>

=== 정답 및 해설지 구조 (문제지 뒤 새 페이지에 자동 배치됨) ===
<section class="answer-sheet">
  <h2 class="answer-title">정답 및 해설</h2>
  <div class="quick-answers">
    <div class="qa-grid">
      <div class="qa-cell"><span class="qa-num">01</span><span class="qa-ans">④</span></div>
      <!-- 전 문항 반복. 5칸 그리드로 자동 배열됨 -->
    </div>
  </div>
  <div class="explanations">
    <div class="exp">
      <p><span class="exp-num">01</span><b>정답 ④</b></p>
      <p>정답 해설: 자료의 어느 부분에 근거해 왜 정답인지 구체적으로 서술.</p>
      <p><span class="badge">바로알기</span>① 이 선지가 틀린 이유를 설명.</p>
      <p><span class="badge">바로알기</span>② ...</p>
      <!-- 오답 선지마다 '바로알기' 배지를 붙여 설명 -->
    </div>
    <!-- 문항 수만큼 반복 -->
  </div>
</section>

[3. 해설 기준]
- 모든 문항에 대해 정답 근거를 자료 내용에 기반해 상세히 설명할 것.
- 오답 선지는 각각 '바로알기' 배지와 함께 왜 틀렸는지 설명할 것 (함정 포인트 명시).`;
}

/* ==========================================================================
   상태
   ========================================================================== */
const state = {
  files: [], // { name, size, kind: 'pdf'|'image'|'text', mediaType, data(base64) | text }
  lastExamHtml: null, // 완성된 전체 HTML 문서
};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const apiKeyInput = $("apiKey");
const keyStatus = $("keyStatus");
const dropZone = $("dropZone");
const fileInput = $("fileInput");
const fileListEl = $("fileList");
const generateBtn = $("generateBtn");
const progressEl = $("progress");
const progressText = $("progressText");
const errorBox = $("errorBox");
const resultCard = $("resultCard");
const previewFrame = $("previewFrame");

/* ==========================================================================
   API 키 저장/불러오기
   ========================================================================== */
try {
  const saved = localStorage.getItem("anthropic_api_key");
  if (saved) {
    apiKeyInput.value = saved;
    keyStatus.textContent = "✅ 저장된 키를 불러왔습니다.";
  }
} catch (_) { /* localStorage 차단 환경 */ }

$("saveKey").addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.textContent = "키를 입력하세요.";
    return;
  }
  try {
    localStorage.setItem("anthropic_api_key", key);
    keyStatus.textContent = "✅ 이 브라우저에 저장되었습니다.";
  } catch (_) {
    keyStatus.textContent = "⚠ 저장할 수 없는 환경입니다. 이번 세션 동안만 사용됩니다.";
  }
});

$("toggleKey").addEventListener("click", () => {
  apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
});

/* ==========================================================================
   파일 업로드
   ========================================================================== */
dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  addFiles([...fileInput.files]);
  fileInput.value = "";
});
["dragover", "dragenter"].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  })
);
dropZone.addEventListener("drop", (e) => addFiles([...e.dataTransfer.files]));

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

async function addFiles(files) {
  hideError();
  for (const file of files) {
    try {
      const entry = await readFile(file);
      state.files.push(entry);
    } catch (err) {
      showError(`"${file.name}" 파일을 읽을 수 없습니다: ${err.message}`);
    }
  }
  renderFileList();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = IMAGE_TYPES.includes(file.type);
    const isText = file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);

    if (!isPdf && !isImage && !isText) {
      reject(new Error("지원하지 않는 형식입니다 (PDF/이미지/텍스트만 가능)"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("읽기 오류"));

    if (isText) {
      reader.onload = () =>
        resolve({ name: file.name, size: file.size, kind: "text", text: reader.result });
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        // data:application/pdf;base64,XXXX → base64 부분만 추출
        const base64 = String(reader.result).split(",")[1];
        resolve({
          name: file.name,
          size: file.size,
          kind: isPdf ? "pdf" : "image",
          mediaType: isPdf ? "application/pdf" : file.type,
          data: base64,
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

function renderFileList() {
  fileListEl.innerHTML = "";
  state.files.forEach((f, i) => {
    const li = document.createElement("li");
    const icon = f.kind === "pdf" ? "📕" : f.kind === "image" ? "🖼" : "📄";
    li.innerHTML = `
      <span>${icon}</span>
      <span class="fname"></span>
      <span class="fsize">${formatSize(f.size)}</span>
      <button type="button" class="remove" title="삭제">✕</button>`;
    li.querySelector(".fname").textContent = f.name;
    li.querySelector(".remove").addEventListener("click", () => {
      state.files.splice(i, 1);
      renderFileList();
    });
    fileListEl.appendChild(li);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

/* ==========================================================================
   문제 생성 (Claude API 스트리밍 호출)
   ========================================================================== */
generateBtn.addEventListener("click", generate);

async function generate() {
  hideError();

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showError("1단계에서 API 키를 먼저 입력해 주세요.");
    apiKeyInput.focus();
    return;
  }

  const pasted = $("pastedText").value.trim();
  if (state.files.length === 0 && !pasted) {
    showError("2단계에서 학습 자료를 업로드하거나 텍스트를 붙여넣어 주세요.");
    return;
  }

  const totalBytes = state.files.reduce((s, f) => s + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    showError(`업로드한 파일 용량이 너무 큽니다 (${formatSize(totalBytes)}). 25MB 이하로 줄여 주세요.`);
    return;
  }

  const numQ = $("numQuestions").value;
  const difficulty = $("difficulty").value;
  const title = $("examTitle").value.trim() || "고난도 내신 대비 문제";
  const extra = $("extraNotes").value.trim();
  const model = $("model").value;

  // 사용자 메시지 content 블록 구성 (PDF·이미지는 base64로 직접 전달)
  const content = [];
  for (const f of state.files) {
    if (f.kind === "pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: f.data },
      });
    } else if (f.kind === "image") {
      content.push({
        type: "image",
        source: { type: "base64", media_type: f.mediaType, data: f.data },
      });
    } else {
      content.push({ type: "text", text: `[자료: ${f.name}]\n${f.text}` });
    }
  }
  if (pasted) content.push({ type: "text", text: `[붙여넣은 자료]\n${pasted}` });

  content.push({
    type: "text",
    text: [
      `위 학습 자료를 분석해서 시험지를 제작해 줘.`,
      `- 총 문항 수: ${numQ}문제`,
      `- 난이도: ${difficulty}`,
      extra ? `- 추가 요청: ${extra}` : "",
      `시스템 지침에 정의된 HTML 구조(exam-body / answer-sheet 두 섹션)만 출력할 것.`,
    ].filter(Boolean).join("\n"),
  });

  setBusy(true, "자료를 분석하고 문제를 출제하는 중입니다… (1~3분 정도 걸릴 수 있어요)");

  try {
    const html = await callClaudeStreaming(apiKey, model, content);
    const cleaned = stripCodeFences(html);
    renderExam(title, numQ, cleaned);
  } catch (err) {
    showError(errorMessage(err));
  } finally {
    setBusy(false);
  }
}

async function callClaudeStreaming(apiKey, model, content) {
  const body = {
    model,
    max_tokens: 64000,
    stream: true,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content }],
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
      // 브라우저에서 직접 호출(CORS)을 허용하는 헤더
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || "";
    } catch (_) { /* ignore */ }
    const e = new Error(detail || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }

  // SSE 스트림 파싱
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let stopReason = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // 마지막 불완전한 줄은 버퍼에 유지

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let event;
      try { event = JSON.parse(payload); } catch (_) { continue; }

      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        text += event.delta.text;
        progressText.textContent = `시험지를 작성하는 중… (${text.length.toLocaleString()}자)`;
      } else if (event.type === "message_delta" && event.delta?.stop_reason) {
        stopReason = event.delta.stop_reason;
      } else if (event.type === "error") {
        throw new Error(event.error?.message || "스트리밍 중 오류가 발생했습니다.");
      }
    }
  }

  if (stopReason === "refusal") {
    throw new Error("모델이 이 자료에 대한 문제 생성을 거절했습니다. 자료 내용을 확인해 주세요.");
  }
  if (stopReason === "max_tokens") {
    console.warn("출력이 최대 길이에서 잘렸습니다.");
  }
  if (!text.trim()) {
    throw new Error("모델 응답이 비어 있습니다. 다시 시도해 주세요.");
  }
  return text;
}

function stripCodeFences(text) {
  return text
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function errorMessage(err) {
  const msg = err.message || String(err);
  if (err.status === 401) return "API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.";
  if (err.status === 429) return "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  if (err.status === 400 && /credit/i.test(msg)) return "API 크레딧이 부족합니다. Anthropic 콘솔에서 충전 후 이용해 주세요.";
  if (err instanceof TypeError && /fetch/i.test(msg)) return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.";
  return "오류가 발생했습니다: " + msg;
}

/* ==========================================================================
   시험지 렌더링 & 다운로드
   ========================================================================== */
function renderExam(title, numQ, bodyHtml) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}.`;

  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>${EXAM_CSS}</style>
</head>
<body>
<div class="sheet">
  <header class="exam-header">
    <h1>${escapeHtml(title)}</h1>
    <div class="exam-info">
      <span>총 ${escapeHtml(String(numQ))}문항</span>
      <span>${dateStr}</span>
      <span>제한시간: ____분</span>
    </div>
    <div class="name-line"><span>학년/반: ________</span><span>이름: ____________</span><span>점수: ______</span></div>
  </header>
  ${bodyHtml}
</div>
</body>
</html>`;

  state.lastExamHtml = fullHtml;
  previewFrame.srcdoc = fullHtml;
  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth" });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

$("printBtn").addEventListener("click", () => {
  if (!previewFrame.srcdoc) return;
  previewFrame.contentWindow.focus();
  previewFrame.contentWindow.print();
});

$("downloadHtmlBtn").addEventListener("click", () => {
  if (!state.lastExamHtml) return;
  const blob = new Blob([state.lastExamHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "내신문제.html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ==========================================================================
   진행 상태 / 오류 표시
   ========================================================================== */
function setBusy(busy, msg) {
  generateBtn.disabled = busy;
  progressEl.hidden = !busy;
  if (msg) progressText.textContent = msg;
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}

/* ==========================================================================
   샘플 (API 호출 없이 디자인 확인용)
   ========================================================================== */
$("sampleBtn").addEventListener("click", () => {
  renderExam("디자인 미리보기 — 생명과학Ⅰ", 2, SAMPLE_BODY);
});

const SAMPLE_BODY = `
<section class="exam-body">
  <div class="question">
    <p><span class="q-num">01</span><span class="q-text">세포막을 통한 물질 이동에 대한 설명으로 옳지 <u>않은</u> 것은?</span></p>
    <ol class="choices">
      <li>① 확산은 고농도에서 저농도로 물질이 이동하는 현상이다.</li>
      <li>② 삼투는 반투과성 막을 통한 물의 확산이다.</li>
      <li>③ 능동 수송은 ATP를 소모하지 않는다.</li>
      <li>④ 촉진 확산은 막단백질의 도움을 받는다.</li>
      <li>⑤ 세포내 섭취는 막의 함입으로 일어난다.</li>
    </ol>
  </div>
  <div class="question">
    <p><span class="q-num">02</span><span class="q-text">그림은 어떤 세포의 물질 이동을 나타낸 것이다. 이에 대한 설명으로 옳은 것만을 &lt;보기&gt;에서 있는 대로 고른 것은?</span></p>
    <div class="q-passage">(가) 농도 기울기에 따라 인지질 2중층을 직접 통과하는 이동<br>(나) 수송 단백질을 통해 에너지를 사용하는 이동</div>
    <div class="boki-box"><span class="boki-label">보 기</span>
      <p>ㄱ. (가)는 단순 확산이다.</p>
      <p>ㄴ. (나)에서 ATP가 소모된다.</p>
      <p>ㄷ. 산소는 (나)의 방식으로 이동한다.</p>
    </div>
    <ol class="choices grid32">
      <li>① ㄱ</li><li>② ㄷ</li><li>③ ㄱ, ㄴ</li><li>④ ㄴ, ㄷ</li><li>⑤ ㄱ, ㄴ, ㄷ</li>
    </ol>
  </div>
</section>
<section class="answer-sheet">
  <h2 class="answer-title">정답 및 해설</h2>
  <div class="quick-answers">
    <div class="qa-grid">
      <div class="qa-cell"><span class="qa-num">01</span><span class="qa-ans">③</span></div>
      <div class="qa-cell"><span class="qa-num">02</span><span class="qa-ans">③</span></div>
    </div>
  </div>
  <div class="explanations">
    <div class="exp">
      <p><span class="exp-num">01</span><b>정답 ③</b></p>
      <p>능동 수송은 농도 기울기를 거슬러 물질을 이동시키므로 반드시 ATP를 소모한다. 따라서 'ATP를 소모하지 않는다'는 설명은 옳지 않다.</p>
      <p><span class="badge">바로알기</span>① 확산은 고농도 → 저농도 방향의 자발적 이동이 맞다.</p>
      <p><span class="badge">바로알기</span>② 삼투는 물이 반투과성 막을 통해 확산하는 현상이 맞다.</p>
    </div>
    <div class="exp">
      <p><span class="exp-num">02</span><b>정답 ③</b></p>
      <p>(가)는 인지질 2중층을 직접 통과하므로 단순 확산(ㄱ 옳음), (나)는 에너지를 사용하므로 능동 수송으로 ATP가 소모된다(ㄴ 옳음).</p>
      <p><span class="badge">바로알기</span>ㄷ. 산소는 크기가 작은 무극성 분자로 (가)의 단순 확산 방식으로 이동한다.</p>
    </div>
  </div>
</section>`;
