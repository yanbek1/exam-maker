/* ==========================================================================
   문제 출제실 — 웹사이트용 호환층
   Claude 아티팩트 안에서 쓰던 claude.use("sample" | "db" | "user" | "downloads")를
   일반 웹사이트(GitHub Pages)에서 흉내 낸다.
   - sample   : 사용자가 넣은 Anthropic API 키로 Messages API를 브라우저에서 직접 호출 (스트리밍)
   - db       : 이 브라우저의 IndexedDB (지난 문제·필기·달력·학습지 답안이 이 기기에만 저장된다)
   - user     : 이 기기 사용자 한 명
   - downloads: 파일 내려받기
   아티팩트 안(이미 window.claude가 있을 때)에서는 아무것도 하지 않는다.
   ========================================================================== */
(function () {
  "use strict";
  if (window.claude && typeof window.claude.use === "function") return;

  var KEY_STORE = "examroom.anthropicKey";
  var MODEL_STORE = "examroom.models";
  var API_URL = "https://api.anthropic.com/v1/messages";
  var DEFAULT_MODELS = { "default": "claude-sonnet-5-5", complex: "claude-opus-5-5" };

  function readLS(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function writeLS(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) {} }
  function apiKey() { return (readLS(KEY_STORE) || "").trim(); }
  function models() {
    var m = {};
    try { m = JSON.parse(readLS(MODEL_STORE) || "{}") || {}; } catch (e) { m = {}; }
    return { "default": m["default"] || DEFAULT_MODELS["default"], complex: m.complex || DEFAULT_MODELS.complex };
  }
  function err(code, message) { var e = new Error(message || code); e.code = code; return e; }

  /* ---------------- sample: Anthropic Messages API ---------------- */
  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result || ""); res(s.slice(s.indexOf(",") + 1)); };
      r.onerror = function () { rej(r.error); };
      r.readAsDataURL(blob);
    });
  }
  var IMG_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  async function call(prompt, opts) {
    opts = opts || {};
    var key = apiKey();
    if (!key) { openKeyPanel(true); throw err("api_key", "Anthropic API 키가 없습니다."); }
    var content = [];
    var imgs = opts.images || [];
    for (var i = 0; i < imgs.length; i++) {
      var b = imgs[i];
      var type = IMG_TYPES.indexOf(b.type) >= 0 ? b.type : "image/jpeg";
      content.push({ type: "image", source: { type: "base64", media_type: type, data: await blobToBase64(b) } });
    }
    content.push({ type: "text", text: String(prompt) });
    var tier = opts.modelTier === "complex" ? "complex" : "default";
    var body = { model: models()[tier], max_tokens: opts.maxTokens || 32000, stream: true, messages: [{ role: "user", content: content }] };
    var res;
    try {
      res = await fetch(API_URL, {
        method: "POST", signal: opts.signal,
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify(body)
      });
    } catch (e) {
      if (e && e.name === "AbortError") { var c = err("cancelled", "중단했습니다."); c.name = "AbortError"; throw c; }
      throw err("network", "인터넷 연결을 확인해 주세요.");
    }
    if (!res.ok) {
      var t = ""; try { t = await res.text(); } catch (e) {}
      var msg = t; try { msg = (JSON.parse(t).error || {}).message || t; } catch (e) {}
      if (res.status === 401 || res.status === 403) { openKeyPanel(true); throw err("api_key", "API 키가 올바르지 않습니다. (" + msg + ")"); }
      if (res.status === 429 || res.status === 529 || res.status === 503) throw err("rate_limited", msg);
      if (res.status === 413 || /prompt is too long|too long/i.test(msg)) throw err("prompt_too_large", msg);
      if (res.status === 400 && /image/i.test(msg)) throw err("image_rejected", msg);
      if (res.status === 404 && /model/i.test(msg)) throw err("model_unavailable", "모델을 찾을 수 없습니다: " + msg + " — 🔑 설정에서 모델 이름을 바꿔 주세요.");
      if (res.status === 400 && /credit|billing|balance/i.test(msg)) throw err("billing", "API 크레딧이 부족합니다. Anthropic Console에서 결제 정보를 확인해 주세요.");
      throw err("api_error", "API 오류 " + res.status + ": " + msg);
    }
    // SSE 스트림을 읽으며 글자가 늘 때마다 onText({ text })를 부른다
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = "", text = "", stop = null;
    try {
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        var parts = buf.split("\n\n"); buf = parts.pop();
        for (var p = 0; p < parts.length; p++) {
          var lines = parts[p].split("\n"), data = "";
          for (var l = 0; l < lines.length; l++) if (lines[l].indexOf("data:") === 0) data += lines[l].slice(5).trim();
          if (!data) continue;
          var ev; try { ev = JSON.parse(data); } catch (e) { continue; }
          if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") {
            text += ev.delta.text;
            if (opts.onText) { try { opts.onText({ text: text }); } catch (e) {} }
          } else if (ev.type === "message_delta" && ev.delta && ev.delta.stop_reason) stop = ev.delta.stop_reason;
          else if (ev.type === "error") throw err(ev.error && ev.error.type === "overloaded_error" ? "rate_limited" : "api_error", (ev.error && ev.error.message) || "API 오류");
        }
      }
    } catch (e) {
      if (e && e.name === "AbortError") { var c2 = err("cancelled", "중단했습니다."); c2.name = "AbortError"; throw c2; }
      throw e;
    }
    if (stop === "refusal") throw err("refused", "거절되었습니다.");
    return { text: text, truncated: stop === "max_tokens" };
  }
  function parseJson(text) {
    var s = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    var a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    return JSON.parse(s);
  }
  var sample = function (prompt, opts) { return call(prompt, opts); };
  sample.json = async function (prompt, opts) {
    var r = await call(prompt, opts);
    try { return parseJson(r.text); } catch (e) { var x = err("invalid_json", "JSON이 아닙니다."); x.text = r.text; throw x; }
  };
  sample.limits = async function () { return { maxPromptBytes: 65536, images: { maxCount: 20, maxInputBytes: 3700000 } }; };

  /* ---------------- db: IndexedDB 문서 저장소 ---------------- */
  var dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var q = indexedDB.open("examroom-site", 1);
      q.onupgradeneeded = function () { var os = q.result.createObjectStore("docs", { keyPath: "k" }); os.createIndex("c", "c"); };
      q.onsuccess = function () { res(q.result); };
      q.onerror = function () { rej(q.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction("docs", mode), os = t.objectStore("docs"), out;
        try { out = fn(os); } catch (e) { rej(e); return; }
        t.oncomplete = function () { res(out && out.result !== undefined && out instanceof IDBRequest ? out.result : out); };
        t.onerror = function () { var e = t.error; rej(e && e.name === "QuotaExceededError" ? err("quota_exceeded", "저장 공간이 가득 찼습니다.") : e); };
        t.onabort = function () { rej(t.error || err("aborted")); };
      });
    });
  }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function snap(id, data) { return { id: id, exists: data !== undefined, data: function () { return clone(data); } }; }
  function docRef(cpath, id) {
    var k = cpath + "\u0000" + id;
    return {
      id: id,
      get: function () { return tx("readonly", function (os) { return os.get(k); }).then(function (row) { return snap(id, row ? row.v : undefined); }); },
      set: function (v) { var row = { k: k, c: cpath, id: id, v: clone(v) }; return tx("readwrite", function (os) { os.put(row); }).then(function () {}); },
      update: function (v) {
        return tx("readwrite", function (os) {
          var g = os.get(k);
          g.onsuccess = function () { var cur = (g.result && g.result.v) || {}; var nv = Object.assign({}, cur, clone(v)); os.put({ k: k, c: cpath, id: id, v: nv }); };
        }).then(function () {});
      },
      "delete": function () { return tx("readwrite", function (os) { os["delete"](k); }).then(function () {}); },
      collection: function (name) { return collRef(cpath + "/" + id + "/" + name); }
    };
  }
  function collRef(cpath, q) {
    q = q || {};
    return {
      doc: function (id) { return docRef(cpath, id); },
      orderBy: function (f, dir) { return collRef(cpath, Object.assign({}, q, { f: f, dir: dir })); },
      limit: function (n) { return collRef(cpath, Object.assign({}, q, { n: n })); },
      get: function () {
        return tx("readonly", function (os) { return os.index("c").getAll(cpath); }).then(function (rows) {
          rows = rows || [];
          if (q.f) rows.sort(function (a, b) {
            var x = (a.v || {})[q.f], y = (b.v || {})[q.f];
            x = x == null ? 0 : x; y = y == null ? 0 : y;
            return (x < y ? -1 : x > y ? 1 : 0) * (q.dir === "desc" ? -1 : 1);
          });
          if (q.n) rows = rows.slice(0, q.n);
          var docs = rows.map(function (r) { return snap(r.id, r.v); });
          return { docs: docs, size: docs.length, empty: !docs.length };
        });
      }
    };
  }
  var db = {
    collection: function (name) { return collRef(name); },
    doc: function (path) { var p = String(path).split("/"); var id = p.pop(); return docRef(p.join("/"), id); }
  };

  var user = { id: async function () { return "local"; }, isOwner: async function () { return true; } };
  var downloads = {
    save: async function (o) {
      var data = o && o.data, blob = data instanceof Blob ? data : new Blob([data == null ? "" : data], { type: (o && o.type) || "application/octet-stream" });
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = (o && o.filename) || "download"; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
      return true;
    }
  };
  var caps = { sample: sample, db: db, user: user, downloads: downloads };
  window.claude = { use: async function (n) { if (!caps[n]) throw err("not_declared", n); return caps[n]; } };

  /* ---------------- API 키 설정 창 ---------------- */
  var panel = null;
  function openKeyPanel(warn) {
    if (!document.body) { document.addEventListener("DOMContentLoaded", function () { openKeyPanel(warn); }); return; }
    if (!panel) build();
    panel.hidden = false;
    panel.querySelector(".ks-warn").hidden = !warn;
    var m = models();
    panel.querySelector("#ksKey").value = apiKey();
    panel.querySelector("#ksM1").value = m["default"];
    panel.querySelector("#ksM2").value = m.complex;
    setTimeout(function () { panel.querySelector("#ksKey").focus(); }, 30);
  }
  function build() {
    var css = document.createElement("style");
    css.textContent =
      ".ks-btn{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:90;border:1px solid #cbd2dd;background:#fff;color:#111827;border-radius:999px;padding:7px 13px;font:600 13px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 4px 14px rgba(16,24,40,.15);cursor:pointer}" +
      ".ks-btn.need{background:#b9332a;border-color:#b9332a;color:#fff}" +
      "body.st-lock .ks-btn,body.pv-lock .ks-btn{display:none}" +
      ".ks-wrap{position:fixed;inset:0;z-index:95;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:16px}" +
      ".ks-wrap[hidden]{display:none}" +
      ".ks{background:#fff;color:#111827;border-radius:14px;max-width:440px;width:100%;padding:18px 18px 16px;font:14px/1.6 system-ui,-apple-system,'Apple SD Gothic Neo',sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.25)}" +
      ".ks h2{margin:0 0 6px;font-size:17px}.ks p{margin:4px 0 10px;color:#566074;font-size:13px}" +
      ".ks label{display:block;font-size:12px;font-weight:700;margin:8px 0 3px}.ks input{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #cbd2dd;border-radius:8px;font:inherit}" +
      ".ks .row{display:flex;gap:8px;margin-top:12px}.ks .row button{flex:1;padding:9px;border-radius:8px;border:1px solid #1d3f94;background:#1d3f94;color:#fff;font:inherit;font-weight:700;cursor:pointer}" +
      ".ks .row button.g{background:#fff;color:#111827;border-color:#cbd2dd}.ks-warn{color:#b9332a!important;font-weight:700}.ks details{margin-top:6px}.ks summary{cursor:pointer;font-size:12px;color:#566074}";
    document.head.appendChild(css);
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "ks-btn"; btn.textContent = "🔑 API 키";
    btn.addEventListener("click", function () { openKeyPanel(false); });
    document.body.appendChild(btn);
    panel = document.createElement("div");
    panel.className = "ks-wrap"; panel.hidden = true;
    panel.innerHTML =
      '<div class="ks" role="dialog" aria-label="API 키 설정"><h2>Anthropic API 키</h2>' +
      '<p class="ks-warn" hidden>문제를 만들려면 API 키가 필요합니다.</p>' +
      '<p>이 웹사이트는 문제를 만들 때 Anthropic API를 직접 부릅니다. <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Anthropic Console</a>에서 키를 만들어 넣어 주세요. 사용한 만큼 요금이 나옵니다.<br>키는 <b>이 브라우저에만</b> 저장되고, 이 사이트 서버에는 보내지 않습니다(서버가 없습니다). 공용 컴퓨터에서는 다 쓰고 [지우기]를 누르세요.</p>' +
      '<label for="ksKey">API 키</label><input id="ksKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-...">' +
      '<details><summary>모델 바꾸기 (보통은 그대로 두세요)</summary><label for="ksM1">기본</label><input id="ksM1" spellcheck="false"><label for="ksM2">어려운 작업(검수·채점)</label><input id="ksM2" spellcheck="false"></details>' +
      '<div class="row"><button type="button" class="g" id="ksDel">지우기</button><button type="button" class="g" id="ksClose">닫기</button><button type="button" id="ksSave">저장</button></div></div>';
    document.body.appendChild(panel);
    function paint() { btn.classList.toggle("need", !apiKey()); btn.textContent = apiKey() ? "🔑 API 키" : "🔑 API 키 넣기"; }
    panel.querySelector("#ksSave").addEventListener("click", function () {
      writeLS(KEY_STORE, panel.querySelector("#ksKey").value.trim() || null);
      writeLS(MODEL_STORE, JSON.stringify({ "default": panel.querySelector("#ksM1").value.trim(), complex: panel.querySelector("#ksM2").value.trim() }));
      panel.hidden = true; paint();
    });
    panel.querySelector("#ksDel").addEventListener("click", function () { writeLS(KEY_STORE, null); panel.querySelector("#ksKey").value = ""; paint(); });
    panel.querySelector("#ksClose").addEventListener("click", function () { panel.hidden = true; });
    panel.addEventListener("click", function (e) { if (e.target === panel) panel.hidden = true; });
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { if (!panel) build(); });
  else build();
})();
