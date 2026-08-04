/**
 * Question bank, distribution, file parsing, "web feed" simulation
 */
const Questions = (() => {
  const DIFF = { easy: "easy", medium: "medium", hard: "hard" };
  const RATIO = { easy: 0.3, medium: 0.3, hard: 0.4 }; // 30 / 30 / 40

  /** @type {Array} */
  let sampleBank = [];

  /** Extra web-style bank generated for "fetch from web" mode */
  let webBank = [];
  let webCountAnimated = 0;
  let webTarget = 0;

  const FN_EASY = [
    "SUM", "AVERAGE", "MAX", "MIN", "COUNT", "COUNTA", "IF", "LEFT", "RIGHT",
    "LEN", "UPPER", "LOWER", "TRIM", "TODAY", "ROUND", "ABS", "SQRT", "AND", "OR",
  ];
  const FN_MED = [
    "SUMIF", "COUNTIF", "AVERAGEIF", "VLOOKUP", "HLOOKUP", "IFERROR", "TEXTJOIN",
    "SUBSTITUTE", "EOMONTH", "NETWORKDAYS", "INDEX", "MATCH", "XLOOKUP", "UNIQUE",
    "FILTER", "SORT", "SUMIFS", "COUNTIFS",
  ];
  const FN_HARD = [
    "INDEX-MATCH", "SUMIFS multi", "XLOOKUP default", "SUMPRODUCT", "AGGREGATE",
    "LET", "LAMBDA", "BYROW", "SCAN", "OFFSET", "INDIRECT", "PMT", "IRR", "XNPV",
    "FORECAST.LINEAR", "TEXTBEFORE", "TEXTAFTER", "REDUCE",
  ];

  function uid(prefix = "q") {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function loadSampleBank() {
    const urls = [
      "data/sample-questions.json",
      "./data/sample-questions.json",
      // absolute from site root (GitHub Pages project)
      (function () {
        try {
          const p = location.pathname.replace(/\/?[^/]*$/, "/");
          // .../quiz/ or .../quiz/index.html → .../quiz/data/
          const base = location.pathname.includes("/quiz")
            ? location.pathname.replace(/\/quiz.*/, "/quiz/")
            : p;
          return base + "data/sample-questions.json";
        } catch {
          return null;
        }
      })(),
    ].filter(Boolean);

    let loaded = false;
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          sampleBank = data;
          loaded = true;
          break;
        }
      } catch {
        /* try next */
      }
    }
    if (!loaded) {
      sampleBank = generateSynthetic(40, "easy")
        .concat(generateSynthetic(40, "medium"))
        .concat(generateSynthetic(50, "hard"));
    }
    seedWebBank();
    return sampleBank;
  }

  function generateSynthetic(n, diff) {
    const pool =
      diff === "easy" ? FN_EASY : diff === "medium" ? FN_MED : FN_HARD;
    const out = [];
    for (let i = 0; i < n; i++) {
      const fn = pool[i % pool.length];
      const correct = `=${fn.includes("-") ? "INDEX/MATCH" : fn}(...)`;
      out.push({
        id: uid(diff[0]),
        q: `[${diff.toUpperCase()}] Tình huống thực tế với hàm ${fn}: chọn công thức phù hợp nhất?`,
        a: [
          correct,
          `=WRONG_${fn}_A()`,
          `=WRONG_${fn}_B()`,
          `=WRONG_${fn}_C()`,
        ],
        correct: 0,
        diff,
        hint: `Gợi ý: xem cú pháp chính thức của ${fn}.`,
        explain: `Đáp án đúng dùng ${fn} theo chuẩn Excel.`,
        type: "mcq",
      });
    }
    return out;
  }

  function seedWebBank() {
    // Mô phỏng nguồn công khai: gộp sample + synthetic lớn
    webBank = shuffle([
      ...sampleBank,
      ...generateSynthetic(80, "easy"),
      ...generateSynthetic(80, "medium"),
      ...generateSynthetic(100, "hard"),
    ]);
    webTarget = webBank.length;
    webCountAnimated = Math.min(40, webTarget);
  }

  /** Animate "realtime" question count (+ few each second) */
  function tickWebCount() {
    if (webCountAnimated < webTarget) {
      webCountAnimated = Math.min(
        webTarget,
        webCountAnimated + 1 + Math.floor(Math.random() * 3)
      );
    } else {
      // dao động nhẹ để cảm giác "cập nhật"
      webCountAnimated = webTarget + Math.floor(Math.random() * 5) - 2;
      if (webCountAnimated < webTarget - 5) webCountAnimated = webTarget;
    }
    return webCountAnimated;
  }

  function getWebCount() {
    return webCountAnimated;
  }

  function normalizeItem(raw, idx) {
    const diff = String(raw.diff || raw.difficulty || "medium").toLowerCase();
    const d =
      diff.startsWith("e") || diff === "dễ" || diff === "de"
        ? "easy"
        : diff.startsWith("h") || diff === "khó" || diff === "kho"
          ? "hard"
          : "medium";

    let options = raw.a || raw.options;
    if (!options && (raw.A || raw.aA)) {
      options = [raw.A || raw.aA, raw.B || raw.aB, raw.C || raw.aC, raw.D || raw.aD];
    }
    if (!Array.isArray(options)) options = ["A", "B", "C", "D"];
    options = options.map((x) => String(x ?? "").trim()).filter(Boolean);
    while (options.length < 4) options.push(`(trống ${options.length + 1})`);

    let correct = raw.correct;
    if (typeof correct === "string") {
      const letter = correct.trim().toUpperCase();
      if (/^[ABCD]$/.test(letter)) correct = letter.charCodeAt(0) - 65;
      else {
        const found = options.findIndex(
          (o) => o.toLowerCase() === correct.toLowerCase()
        );
        correct = found >= 0 ? found : 0;
      }
    }
    if (typeof correct !== "number" || correct < 0 || correct > 3) correct = 0;

    return {
      id: raw.id || uid("u"),
      q: String(raw.q || raw.question || raw.Câu_hỏi || `Câu ${idx + 1}`),
      a: options.slice(0, 4),
      correct,
      diff: d,
      hint: String(raw.hint || raw.Gợi_ý || "Chưa có gợi ý."),
      explain: String(raw.explain || raw.Giải_thích || "Xem lại cú pháp hàm Excel."),
      type: raw.type === "formula" ? "formula" : "mcq",
      formulaAnswer: raw.formulaAnswer || raw.a?.[raw.correct] || "",
    };
  }

  /**
   * Lấy đúng 100 câu: 30 easy, 30 medium, 40 hard
   */
  function buildBalancedSet(sourceList, size = 100) {
    const need = {
      easy: Math.round(size * RATIO.easy),
      medium: Math.round(size * RATIO.medium),
      hard: size - Math.round(size * RATIO.easy) - Math.round(size * RATIO.medium),
    };

    const by = { easy: [], medium: [], hard: [] };
    for (const raw of sourceList) {
      const item = normalizeItem(raw);
      by[item.diff].push(item);
    }

    // pad if missing
    for (const d of ["easy", "medium", "hard"]) {
      if (by[d].length < need[d]) {
        by[d] = by[d].concat(generateSynthetic(need[d] - by[d].length + 5, d));
      }
    }

    const pick = (d, n) => shuffle(by[d]).slice(0, n);
    const selected = [
      ...pick("easy", need.easy),
      ...pick("medium", need.medium),
      ...pick("hard", need.hard),
    ];

    // final shuffle for board placement, keep ids unique
    return shuffle(selected).map((q, i) => ({
      ...q,
      boardIndex: i,
      id: q.id || uid("b"),
    }));
  }

  function buildFromSample() {
    return buildBalancedSet(sampleBank.length ? sampleBank : webBank);
  }

  function buildFromWeb() {
    // "Realtime" pool: take currently "available" slice
    const available = webBank.slice(0, Math.max(webCountAnimated, 100));
    return buildBalancedSet(available.length ? available : webBank);
  }

  /** Parse rows from Excel (SheetJS workbook) */
  function parseExcelWorkbook(workbook) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows.map((row, idx) => {
      // flexible headers
      const get = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== "") return row[k];
          const found = Object.keys(row).find(
            (h) => h.toLowerCase().replace(/\s/g, "") === k.toLowerCase().replace(/\s/g, "")
          );
          if (found) return row[found];
        }
        return "";
      };
      return normalizeItem(
        {
          q: get("Câu hỏi", "Cau hoi", "question", "q", "Question"),
          a: [
            get("Đáp án A", "Dap an A", "A", "a", "OptionA"),
            get("Đáp án B", "Dap an B", "B", "b", "OptionB"),
            get("Đáp án C", "Dap an C", "C", "c", "OptionC"),
            get("Đáp án D", "Dap an D", "D", "d", "OptionD"),
          ],
          correct: get("Đáp án đúng", "Dap an dung", "correct", "Answer", "Đúng"),
          diff: get("Độ khó", "Do kho", "difficulty", "diff", "Level"),
          hint: get("Gợi ý", "Goi y", "hint", "Hint"),
          explain: get("Giải thích", "Giai thich", "explain", "Explanation"),
        },
        idx
      );
    }).filter((q) => q.q && q.q !== `Câu ${q.boardIndex + 1}`);
  }

  /** Parse plain text lines into questions (PDF/DOCX text dump) */
  function parseTextToQuestions(text) {
    const blocks = text
      .split(/\n{2,}|={3,}|-{3,}/)
      .map((b) => b.trim())
      .filter((b) => b.length > 10);

    const items = [];
    for (const block of blocks) {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      // Pattern: Q: ... / A) ... B) ... or 1. question
      const qLine =
        lines.find((l) => /^(q|câu|question|\d+[\.\)]|hỏi)/i.test(l)) || lines[0];
      const opts = [];
      for (const l of lines) {
        const m = l.match(/^[A-Da-d][\.\)\-:]\s*(.+)$/);
        if (m) opts.push(m[1]);
      }
      while (opts.length < 4) opts.push(`Phương án ${String.fromCharCode(65 + opts.length)}`);

      const ansLine = lines.find((l) => /đáp án|answer|correct/i.test(l));
      let correct = 0;
      if (ansLine) {
        const m = ansLine.match(/[ABCD]/i);
        if (m) correct = m[0].toUpperCase().charCodeAt(0) - 65;
      }

      items.push(
        normalizeItem({
          q: qLine.replace(/^(q|câu|question)\s*[:.\-]?\s*/i, ""),
          a: opts.slice(0, 4),
          correct,
          diff: items.length % 3 === 0 ? "hard" : items.length % 2 === 0 ? "medium" : "easy",
          hint: "Trích từ file tải lên — kiểm tra lại đáp án nếu cần.",
          explain: "Được parse tự động từ file.",
        })
      );
    }
    return items;
  }

  async function parseFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      return parseExcelWorkbook(wb);
    }
    if (name.endsWith(".docx")) {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return parseTextToQuestions(result.value || "");
    }
    if (name.endsWith(".pdf")) {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it) => it.str).join(" ") + "\n\n";
      }
      return parseTextToQuestions(text);
    }
    if (name.endsWith(".json")) {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : data.questions || [];
      return arr.map((x, i) => normalizeItem(x, i));
    }
    if (name.endsWith(".txt")) {
      return parseTextToQuestions(await file.text());
    }
    throw new Error("Định dạng không hỗ trợ. Dùng .xlsx, .docx, .pdf, .json, .txt");
  }

  function checkAnswer(question, userChoice) {
    if (question.type === "formula") {
      const norm = (s) =>
        String(s || "")
          .trim()
          .replace(/^=+/, "")
          .replace(/\s+/g, "")
          .toUpperCase()
          .replace(/;/g, ",");
      const ok =
        norm(userChoice) === norm(question.formulaAnswer) ||
        norm(userChoice) === norm(question.a[question.correct]);
      return ok;
    }
    return Number(userChoice) === Number(question.correct);
  }

  function pointsFor(diff, usedHint, timeSec) {
    const base = diff === "hard" ? 30 : diff === "medium" ? 20 : 10;
    let p = base;
    if (usedHint) p = Math.max(1, Math.floor(p * 0.7));
    // bonus under 30s
    if (timeSec <= 15) p += 5;
    else if (timeSec <= 30) p += 2;
    return p;
  }

  return {
    DIFF,
    RATIO,
    loadSampleBank,
    buildFromSample,
    buildFromWeb,
    buildBalancedSet,
    parseFile,
    tickWebCount,
    getWebCount,
    checkAnswer,
    pointsFor,
    normalizeItem,
    getSampleCount: () => sampleBank.length,
    getWebBankSize: () => webBank.length,
  };
})();
