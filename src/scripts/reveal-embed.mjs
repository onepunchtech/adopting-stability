import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import Highlight from "reveal.js/plugin/highlight/highlight.esm.js";
import Notes from "reveal.js/plugin/notes/notes.esm.js";

export function initRevealEmbeds() {
  document.querySelectorAll("[data-reveal-embed]").forEach((root) => {
    const revealEl = root.querySelector(".reveal");
    if (!revealEl) return;

    revealEl.tabIndex = 0;
    root.addEventListener("pointerdown", () => revealEl.focus(), {
      passive: true,
    });

    const hash = root.dataset.hash === "true";

    const deck = new Reveal(revealEl, {
      embedded: true,
      keyboardCondition: "focused",
      hash,
      plugins: [Markdown, Highlight, Notes],
    });

    deck.initialize();

    const ro = new ResizeObserver(() => deck.layout());
    ro.observe(root);
  });
}
