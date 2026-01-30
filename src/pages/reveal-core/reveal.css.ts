export async function GET() {
  const css = await import("reveal.js/dist/reveal.css?raw");
  return new Response(css.default, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
}
