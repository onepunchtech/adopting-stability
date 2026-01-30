import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const name = params.name ?? "black";
  // Whitelist themes to avoid arbitrary path imports
  const allowed = new Set([
    "black",
    "white",
    "league",
    "beige",
    "night",
    "serif",
    "simple",
    "sky",
    "solarized",
    "moon",
    "blood",
  ]);
  const theme = allowed.has(name) ? name : "black";

  const css = await import(`reveal.js/dist/theme/${theme}.css?raw`);
  return new Response(css.default, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
};
