pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const viewer    = document.getElementById("pdf-viewer");
const container = document.getElementById("pdf-container");
const status    = document.getElementById("pdf-status");
const pdfUrl    = viewer.dataset.url;
const SCALE     = 1.5;

// ── Popup ────────────────────────────────────────────────────
const popup            = document.getElementById("popup");
const popupWord        = document.getElementById("popup-word");
const popupTranslation = document.getElementById("popup-translation");
const btnSave          = document.getElementById("btn-save");
const btnKnown         = document.getElementById("btn-known");
let currentWord = "", currentTranslation = "";

function cleanWord(t) { return t.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").toLowerCase(); }

function showPopup(e) {
    popup.style.visibility = "hidden";
    popup.style.display    = "block";
    const h = popup.offsetHeight;
    popup.style.top        = `${e.pageY - h - 10}px`;
    popup.style.left       = `${e.pageX}px`;
    popup.style.visibility = "visible";
}

function feedback(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg; btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
}

async function postVocab(ep) {
    return (await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: currentWord, translation: currentTranslation }),
    })).ok;
}

let activeSpan = null;

function setActiveSpan(span) {
    if (activeSpan) activeSpan.classList.remove("word-active");
    activeSpan = span;
    if (span) span.classList.add("word-active");
}

document.addEventListener("click", async (e) => {
    if (popup.contains(e.target)) return;
    const span = e.target.closest(".word");
    if (!span) { popup.style.display = "none"; setActiveSpan(null); return; }
    const word = cleanWord(span.textContent);
    if (!word) return;
    setActiveSpan(span);
    const res  = await fetch(`/reader/api/translate?word=${encodeURIComponent(word)}`);
    if (!res.ok) return;
    const data = await res.json();
    currentWord = data.word; currentTranslation = data.translation;
    popupWord.textContent = data.word; popupTranslation.textContent = data.translation;
    showPopup(e);
});

btnSave.addEventListener("click", async () =>
    feedback(btnSave, (await postVocab("/vocabulary/api/save")) ? "Salvo ✓" : "Erro"));

btnKnown.addEventListener("click", async () => {
    if (await postVocab("/vocabulary/api/known")) {
        feedback(btnKnown, "Conhecida ✓");
        setTimeout(() => { popup.style.display = "none"; }, 1000);
    } else { feedback(btnKnown, "Erro"); }
});

// ── Helpers ──────────────────────────────────────────────────
function hasText(items) {
    return items.some(i => i.str && i.str.trim().length > 0);
}

function overlayFromPdfText(textLayer, items, viewport) {
    for (const item of items) {
        if (!item.str) continue;
        const tx       = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontSize = Math.abs(tx[0]);
        const div      = document.createElement("div");
        div.style.cssText = `position:absolute;left:${tx[4]}px;top:${tx[5]-fontSize}px;` +
            `font-size:${fontSize}px;white-space:pre;color:transparent;` +
            `cursor:pointer;line-height:1;user-select:none;`;
        item.str.split(/(\s+)/).forEach(tok => {
            if (/^\s+$/.test(tok)) { div.appendChild(document.createTextNode(tok)); return; }
            if (!tok) return;
            const s = document.createElement("span");
            s.className = "word"; s.textContent = tok;
            div.appendChild(s);
        });
        textLayer.appendChild(div);
    }
}

// Two workers: PSM 11 for normal (dark text on light), PSM 11 for inverted (white text on dark)
let _workerNormal = null, _workerInverted = null;

async function initWorkers() {
    if (_workerNormal) return;
    [_workerNormal, _workerInverted] = await Promise.all([
        Tesseract.createWorker("eng"),
        Tesseract.createWorker("eng"),
    ]);
    await Promise.all([
        _workerNormal.setParameters({ tessedit_pageseg_mode: "11" }),
        _workerInverted.setParameters({ tessedit_pageseg_mode: "11" }),
    ]);
}

function makeOCRCanvas(src, invert) {
    const S = 3;
    const c = document.createElement("canvas");
    c.width = src.width * S; c.height = src.height * S;
    const ctx = c.getContext("2d");
    // Grayscale + high contrast, then optional invert for white-on-dark text
    ctx.filter = invert
        ? "saturate(0%) contrast(250%) invert(100%)"
        : "saturate(0%) contrast(250%)";
    ctx.drawImage(src, 0, 0, c.width, c.height);
    ctx.filter = "none";
    return { canvas: c, scale: S };
}

function wordsKey(word) {
    return `${Math.round(word.bbox.x0/10)},${Math.round(word.bbox.y0/10)}`;
}

async function overlayFromOCR(textLayer, canvas) {
    await initWorkers();

    const { canvas: cnNormal,   scale } = makeOCRCanvas(canvas, false);
    const { canvas: cnInverted }        = makeOCRCanvas(canvas, true);

    // Run both passes in parallel
    const [r1, r2] = await Promise.all([
        _workerNormal.recognize(cnNormal),
        _workerInverted.recognize(cnInverted),
    ]);

    // Merge, deduplicate by grid position, keep highest confidence
    const seen = new Map();
    for (const word of [...r1.data.words, ...r2.data.words]) {
        if (!word.text.trim() || word.confidence < 15) continue;
        const key = wordsKey(word);
        if (!seen.has(key) || seen.get(key).confidence < word.confidence) {
            seen.set(key, word);
        }
    }

    const DEBUG = new URLSearchParams(location.search).has("ocrdebug");
    for (const word of seen.values()) {
        const x0 = word.bbox.x0 / scale;
        const y0 = word.bbox.y0 / scale;
        const x1 = word.bbox.x1 / scale;
        const y1 = word.bbox.y1 / scale;
        const span = document.createElement("span");
        span.className   = "word";
        span.textContent = word.text;
        span.style.cssText = `
            position:   absolute;
            left:       ${x0}px;
            top:        ${y0}px;
            width:      ${x1 - x0}px;
            height:     ${y1 - y0}px;
            color:      ${DEBUG ? "#000" : "transparent"};
            background: ${DEBUG ? "rgba(255,220,50,.4)" : "transparent"};
            cursor:     pointer;
            font-size:  ${y1 - y0}px;
            line-height:1;
            user-select:none;
        `;
        textLayer.appendChild(span);
    }
}

// ── Render each page ─────────────────────────────────────────
async function renderPage(page, pageNum, total) {
    status.textContent = `Processando página ${pageNum} de ${total}...`;

    const viewport = page.getViewport({ scale: SCALE });

    const pageDiv = document.createElement("div");
    pageDiv.className  = "pdf-page";
    pageDiv.style.width  = `${viewport.width}px`;
    pageDiv.style.height = `${viewport.height}px`;

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    // Text layer div
    const textLayer = document.createElement("div");
    textLayer.className = "pdf-text-layer";
    textLayer.style.width  = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    // Try embedded text first; fall back to OCR
    const { items } = await page.getTextContent();
    if (hasText(items)) {
        overlayFromPdfText(textLayer, items, viewport);
    } else {
        await overlayFromOCR(textLayer, canvas);
    }

    pageDiv.appendChild(canvas);
    pageDiv.appendChild(textLayer);
    container.appendChild(pageDiv);
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
            await renderPage(await pdf.getPage(i), i, pdf.numPages);
        }
        status.textContent = "";
    } catch (err) {
        status.textContent = `Erro: ${err.message}`;
    }
}

main();
