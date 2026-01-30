import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import Highlight from "reveal.js/plugin/highlight/highlight.esm.js";
import Notes from "reveal.js/plugin/notes/notes.esm.js";

type Options = { hash?: boolean };

function initOne(root: HTMLElement, opts: Options) {
  const revealEl = root.querySelector<HTMLElement>(".reveal");
  if (!revealEl) return;

  // Make it focusable so keyboardCondition:'focused' can work reliably
  revealEl.tabIndex = 0;

  // Click anywhere in this embed -> focus it (so F affects this deck)
  root.addEventListener("pointerdown", () => revealEl.focus(), {
    passive: true,
  });

  const deck = new Reveal(revealEl, {
    embedded: true,
    keyboardCondition: "focused", // key fix for multiple embeds
    hash: opts.hash ?? false,
    plugins: [Markdown, Highlight, Notes],
  });

  deck.initialize();

  const ro = new ResizeObserver(() => deck.layout());
  ro.observe(root);
}

document
  .querySelectorAll<HTMLElement>("[data-reveal-embed]")
  .forEach((root) => {
    const hash = root.dataset.hash === "true";
    initOne(root, { hash });
  });
