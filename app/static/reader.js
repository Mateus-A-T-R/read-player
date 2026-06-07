const popup = document.getElementById("popup");
const popupWord = document.getElementById("popup-word");
const popupTranslation = document.getElementById("popup-translation");
const btnSave = document.getElementById("btn-save");
const btnKnown = document.getElementById("btn-known");

let currentWord = "";
let currentTranslation = "";
let activeSpan = null;

function setActiveSpan(span) {
  if (activeSpan) activeSpan.classList.remove("word-active");
  activeSpan = span;
  if (span) span.classList.add("word-active");
}

function cleanWord(token) {
  return token.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").toLowerCase();
}

function positionAbove(span) {
  popup.style.visibility = "hidden";
  popup.style.display = "block";

  const spanRect = span.getBoundingClientRect();
  const popupHeight = popup.offsetHeight;

  popup.style.top = `${spanRect.top + window.scrollY - popupHeight - 8}px`;
  popup.style.left = `${spanRect.left + window.scrollX}px`;
  popup.style.visibility = "visible";
}

function feedback(btn, message) {
  const original = btn.textContent;
  btn.textContent = message;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1500);
}

async function postVocabulary(endpoint) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: currentWord, translation: currentTranslation }),
  });
  return res.ok;
}

document.getElementById("reader-text").addEventListener("click", async (e) => {
  const span = e.target.closest(".word");
  if (!span) return;

  const word = cleanWord(span.textContent);
  if (!word) return;

  setActiveSpan(span);

  const res = await fetch(`/reader/api/translate?word=${encodeURIComponent(word)}`);
  if (!res.ok) return;

  const data = await res.json();
  currentWord = data.word;
  currentTranslation = data.translation;

  popupWord.textContent = data.word;
  popupTranslation.textContent = data.translation;

  positionAbove(span);
});

btnSave.addEventListener("click", async () => {
  const ok = await postVocabulary("/vocabulary/api/save");
  feedback(btnSave, ok ? "Salvo ✓" : "Erro");
});

btnKnown.addEventListener("click", async () => {
  const ok = await postVocabulary("/vocabulary/api/known");
  if (ok) {
    feedback(btnKnown, "Conhecida ✓");
    setTimeout(() => { popup.style.display = "none"; }, 1000);
  } else {
    feedback(btnKnown, "Erro");
  }
});

document.addEventListener("click", (e) => {
  if (!popup.contains(e.target) && !e.target.closest(".word")) {
    popup.style.display = "none";
    setActiveSpan(null);
  }
});
