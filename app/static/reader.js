const readerEl = document.getElementById("reader-text");
const tooltip = document.getElementById("tooltip");
const tooltipWord = document.getElementById("tooltip-word");
const tooltipTranslation = document.getElementById("tooltip-translation");
const bookId = readerEl ? parseInt(readerEl.dataset.bookId) : null;

document.addEventListener("mouseup", async () => {
  const selection = window.getSelection();
  const word = selection.toString().trim();

  if (!word || word.includes(" ") || !readerEl) {
    tooltip.style.display = "none";
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const context = selection.anchorNode?.parentElement?.closest("p")?.textContent || "";

  const res = await fetch("/reader/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, book_id: bookId, context }),
  });

  if (!res.ok) return;

  const data = await res.json();
  tooltipWord.textContent = data.word;
  tooltipTranslation.textContent = data.translation;

  tooltip.style.display = "block";
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 6}px`;
});

document.addEventListener("mousedown", (e) => {
  if (!tooltip.contains(e.target)) {
    tooltip.style.display = "none";
  }
});
