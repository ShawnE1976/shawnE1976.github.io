/* ============================================================
   ZYROS — interactive logic
   ============================================================ */

(() => {
  "use strict";

  /* ---------- Helpers ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const pad2 = (n) => String(n).padStart(2, "0");
  const nowTs = () => {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Email capture ---------- */
  const SUBSCRIBERS_KEY = "zyros.subscribers";

  const captureEmail = async (emailInput, metaEl, submitBtn) => {
    const raw = (emailInput.value || "").trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw);

    if (!emailOk) {
      metaEl.textContent = "Invalid address — check the format and try again.";
      metaEl.classList.remove("success");
      emailInput.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.75";
    }

    try {
      const existing = JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || "[]");
      if (!existing.includes(raw.toLowerCase())) {
        existing.push(raw.toLowerCase());
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(existing));
      }
    } catch (_) { /* localStorage unavailable – ignore */ }

    await sleep(320);

    metaEl.textContent = `You're in · priority slot reserved for ${raw}`;
    metaEl.classList.add("success");
    emailInput.value = "";

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "";
    }
  };

  const bindForm = (formId, inputId, metaId) => {
    const form  = document.getElementById(formId);
    const input = document.getElementById(inputId);
    const meta  = document.getElementById(metaId);
    if (!form || !input || !meta) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      captureEmail(input, meta, btn);
    });
  };

  bindForm("accessForm",  "accessEmail",  "accessMeta");
  bindForm("accessForm2", "accessEmail2", "accessMeta2");

  /* ---------- Input analysis meters ---------- */
  const inputStream  = $("#inputStream");
  const meterTokens  = $("#meterTokens");
  const meterEntropy = $("#meterEntropy");
  const meterLang    = $("#meterLang");
  const inputStatus  = $("#inputStatus");

  const detectLang = (t) => {
    if (!t.trim()) return "—";
    if (/[一-龯]/.test(t)) return "ZH";
    if (/[぀-ゟ゠-ヿ]/.test(t)) return "JA";
    if (/[а-яА-Я]/.test(t)) return "RU";
    if (/[áéíóúñ¿¡]/i.test(t)) return "ES";
    if (/[àâçéèêëîïôûùüÿœæ]/i.test(t)) return "FR";
    if (/[äöüß]/i.test(t)) return "DE";
    return "EN";
  };
  const calcEntropy = (t) => {
    if (!t) return 0;
    const freq = {};
    for (const ch of t) freq[ch] = (freq[ch] || 0) + 1;
    const n = t.length;
    let h = 0;
    for (const k in freq) {
      const p = freq[k] / n;
      h -= p * Math.log2(p);
    }
    return Math.min(h / 8, 1);
  };

  const updateMeters = () => {
    const v = inputStream.value || "";
    const tokens = v.trim() ? v.trim().split(/\s+/).length : 0;
    meterTokens.textContent  = tokens.toLocaleString();
    meterEntropy.textContent = calcEntropy(v).toFixed(2);
    meterLang.textContent    = detectLang(v);
    inputStatus.textContent  = v.length ? "BUFFERED" : "READY";
  };
  if (inputStream) {
    inputStream.addEventListener("input", updateMeters);
    inputStream.addEventListener("paste", () => setTimeout(updateMeters, 0));
  }

  /* ---------- Output log ---------- */
  const outputLog    = $("#outputLog");
  const outputStatus = $("#outputStatus");
  const outputFoot   = $("#outputFoot");

  const writeLine = (tag, msg, cls = "") => {
    const line = document.createElement("div");
    line.className = `log-line ${cls}`;
    line.innerHTML = `
      <span class="log-ts">${nowTs()}</span>
      <span class="log-tag">[${tag}]</span>
      <span class="log-msg"></span>
    `;
    line.querySelector(".log-msg").textContent = msg;
    outputLog.appendChild(line);
    outputLog.scrollTop = outputLog.scrollHeight;
    return line;
  };

  const writeBlock = (title, items) => {
    const block = document.createElement("div");
    block.className = "log-block";
    const ul = items.map((i) => `<li></li>`).join("");
    block.innerHTML = `<div class="block-title">${title}</div><ul>${ul}</ul>`;
    block.querySelectorAll("li").forEach((li, i) => { li.textContent = items[i]; });
    outputLog.appendChild(block);
    outputLog.scrollTop = outputLog.scrollHeight;
  };

  const typeLine = async (tag, msg, cls = "") => {
    const line = writeLine(tag, "", cls);
    const span = line.querySelector(".log-msg");
    for (let i = 0; i < msg.length; i++) {
      span.textContent = msg.slice(0, i + 1);
      outputLog.scrollTop = outputLog.scrollHeight;
      await sleep(8 + Math.random() * 10);
    }
  };

  const setStatus = (state) => {
    outputStatus.className = "panel-status";
    if (state === "busy") { outputStatus.classList.add("busy"); outputStatus.textContent = "PROCESSING"; }
    else if (state === "ok") { outputStatus.classList.add("ok"); outputStatus.textContent = "COMPLETE"; }
    else { outputStatus.textContent = "IDLE"; }
  };

  /* ---------- Simulated AI ---------- */
  const extractSentences = (text) => {
    return text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
  };

  const keywordsFrom = (text) => {
    const stop = new Set("the a an and or but of to in on at for with by as is are was were be been being from this that these those it its his her their they we you your our i me my he she him".split(" "));
    const words = (text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []).filter((w) => !stop.has(w));
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  };

  const fakeSummarize = (text) => {
    const sentences = extractSentences(text);
    if (!sentences.length) return { bullets: ["(no meaningful content detected)"], theme: "—" };
    const first = sentences[0];
    const mid   = sentences[Math.floor(sentences.length / 2)] || first;
    const last  = sentences[sentences.length - 1];
    const kws   = keywordsFrom(text);
    const bullets = [
      `Core thesis: ${first.slice(0, 140)}${first.length > 140 ? "…" : ""}`,
      sentences.length > 2 ? `Supporting signal: ${mid.slice(0, 140)}${mid.length > 140 ? "…" : ""}` : null,
      sentences.length > 1 ? `Conclusion vector: ${last.slice(0, 140)}${last.length > 140 ? "…" : ""}` : null,
      kws.length ? `Dominant entities: ${kws.join(", ")}` : null,
    ].filter(Boolean);
    return { bullets, theme: kws[0] || "neutral" };
  };

  const fakeQuery = (text) => {
    const kws = keywordsFrom(text);
    const sentences = extractSentences(text);
    if (!sentences.length) {
      return "No indexed content to query. Paste a source into INPUT_STREAM and try again.";
    }
    const anchor = sentences.find((s) => kws.some((k) => s.toLowerCase().includes(k))) || sentences[0];
    return `Answer synthesized from ${sentences.length} statement${sentences.length > 1 ? "s" : ""}: ${anchor.slice(0, 180)}${anchor.length > 180 ? "…" : ""}`;
  };

  const memoryStore = (() => {
    const KEY = "zyros.memory";
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
    const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} };
    return {
      count: () => load().length,
      add: (text) => {
        const list = load();
        const entry = {
          id: "MEM-" + Date.now().toString(36).toUpperCase(),
          snippet: text.slice(0, 120),
          tokens: text.trim().split(/\s+/).length,
          ts: new Date().toISOString(),
        };
        list.push(entry);
        save(list);
        return entry;
      },
    };
  })();

  /* ---------- Command dispatch ---------- */
  const runCommand = async (cmd) => {
    const text = (inputStream.value || "").trim();
    setStatus("busy");

    if (!text) {
      await typeLine("WARN", "INPUT_STREAM is empty. Paste or type text before running a command.", "log-warn");
      setStatus("idle");
      return;
    }

    if (cmd === "summarize") {
      await typeLine("CMD",  "> run summarize --depth=auto", "log-info");
      await typeLine("SYS",  "Processing input…", "log-sys");
      await sleep(260);
      await typeLine("SYS",  "Key insights extracted", "log-sys");
      const { bullets, theme } = fakeSummarize(text);
      writeBlock(`SUMMARY · theme: ${theme}`, bullets);
      await typeLine("OK",   "Analysis complete", "log-ok");
      setStatus("ok");
    } else if (cmd === "query") {
      await typeLine("CMD",  `> run query --context=buffer`, "log-info");
      await typeLine("SYS",  "Scanning indexed segments…", "log-sys");
      await sleep(300);
      const answer = fakeQuery(text);
      await typeLine("OUT",  answer, "log-ok");
      await typeLine("OK",   "Response dispatched", "log-ok");
      setStatus("ok");
    } else if (cmd === "store") {
      await typeLine("CMD",  "> run store --persist=true", "log-info");
      await typeLine("SYS",  "Indexing vectors…", "log-sys");
      await sleep(260);
      const entry = memoryStore.add(text);
      await typeLine("OK",   `Memory Indexed · ${entry.id}`, "log-ok");
      await typeLine("SYS",  `Persistent store size: ${memoryStore.count()} entries`, "log-sys");
      setStatus("ok");
    }

    // Reset status back to idle after a moment
    setTimeout(() => setStatus("idle"), 2600);
  };

  $$(".btn-term").forEach((btn) => {
    btn.addEventListener("click", () => runCommand(btn.dataset.cmd));
  });

  /* ---------- Core stage readout animation (if present) ---------- */
  const readTemp = $("#readTemp");
  const readThru = $("#readThru");
  if (readTemp && readThru) {
    setInterval(() => {
      const t = (0.32 + Math.random() * 0.12).toFixed(2);
      const tb = (1.6 + Math.random() * 1.3).toFixed(2);
      readTemp.textContent = `${t}K`;
      readThru.textContent = `${tb} TB/s`;
    }, 1400);
  }

  /* ---------- Animated throughput footer ---------- */
  if (outputFoot) {
    setInterval(() => {
      const latency = (10 + Math.random() * 8).toFixed(0);
      outputFoot.textContent = `Connection stable · latency ${latency}ms`;
    }, 2100);
  }

  /* ---------- Count-up for hero stats (if present) ---------- */
  const counters = $$(".proof-num[data-count]");
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    counters.forEach((el) => io.observe(el));
  }

  /* ---------- Welcome log ---------- */
  setTimeout(async () => {
    if (!outputLog) return;
    await typeLine("SYS", "Neural mesh online · 64 streams synchronized", "log-sys");
    await typeLine("SYS", "Awaiting manual override command", "log-sys");
  }, 400);

})();
