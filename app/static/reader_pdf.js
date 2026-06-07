pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const viewer    = document.getElementById("pdf-viewer");
const container = document.getElementById("pdf-container");
const loading   = document.getElementById("pdf-loading");
const pdfUrl    = viewer.dataset.url;

// ── Popup (same structure as text reader) ───────────────────
const popup           = document.getElementById("popup");
const popupWord       = document.getElementById("popup-word");
const popupTranslation= document.getElementById("popup-translation");
const btnSave         = document.getElementById("btn-save");
const btnKnown        = document.getElementById("btn-known");
let currentWord = "", currentTranslation = "";

function cleanWord(token) {
    return token.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").toLowerCase();
}

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
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
}

async function postVocab(endpoint) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: currentWord, translation: currentTranslation }),
    });
    return res.ok;
}

document.addEventListener("click", async (e) => {
    if (popup.contains(e.target)) return;

    const span = e.target.closest(".word");
    if (!span) { popup.style.display = "none"; return; }

    const word = cleanWord(span.textContent);
    if (!word) return;

    const res = await fetch(`/reader/api/translate?word=${encodeURIComponent(word)}`);
    if (!res.ok) return;

    const data = await res.json();
    currentWord        = data.word;
    currentTranslation = data.translation;
    popupWord.textContent        = data.word;
    popupTranslation.textContent = data.translation;
    showPopup(e);
});

btnSave.addEventListener("click", async () => {
    feedback(btnSave, (await postVocab("/vocabulary/api/save")) ? "Salvo ✓" : "Erro");
});

btnKnown.addEventListener("click", async () => {
    if (await postVocab("/vocabulary/api/known")) {
        feedback(btnKnown, "Conhecida ✓");
        setTimeout(() => { popup.style.display = "none"; }, 1000);
    } else {
        feedback(btnKnown, "Erro");
    }
});

// ── PDF rendering ────────────────────────────────────────────
async function renderPage(page) {
    const scale    = 1.5;
    const viewport = page.getViewport({ scale });

    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.style.width  = `${viewport.width}px`;
    pageDiv.style.height = `${viewport.height}px`;

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    // Text layer
    const textLayer = document.createElement("div");
    textLayer.className = "pdf-text-layer";
    textLayer.style.width  = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
        if (!item.str) continue;

        const tx       = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontSize = Math.abs(tx[0]);   // scale * original font size

        const itemDiv = document.createElement("div");
        itemDiv.style.cssText = `
            position:   absolute;
            left:       ${tx[4]}px;
            top:        ${tx[5] - fontSize}px;
            font-size:  ${fontSize}px;
            white-space: pre;
            color:      transparent;
            cursor:     pointer;
            line-height: 1;
            user-select: none;
        `;

        item.str.split(/(\s+)/).forEach(token => {
            if (/^\s+$/.test(token)) {
                itemDiv.appendChild(document.createTextNode(token));
            } else if (token) {
                const span = document.createElement("span");
                span.className   = "word";
                span.textContent = token;
                itemDiv.appendChild(span);
            }
        });

        textLayer.appendChild(itemDiv);
    }

    pageDiv.appendChild(canvas);
    pageDiv.appendChild(textLayer);
    container.appendChild(pageDiv);
}

async function main() {
    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        loading.style.display = "none";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            await renderPage(page);
        }
    } catch (err) {
        loading.textContent = `Erro ao carregar PDF: ${err.message}`;
    }
}

main();
