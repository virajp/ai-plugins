// Renders the docs' mermaid fences in the browser. Docs.astro includes this
// only on a page whose markdown carries a mermaid fence, and the library
// itself loads on demand, so a page without a diagram pays nothing.
//
// Shiki has already highlighted the fence into `<pre data-language="mermaid">`;
// the fence text survives as the block's textContent. Each block is swapped
// for a `<div class="mermaid">` holding that text, which mermaid then
// replaces with the SVG. `securityLevel: "loose"` is what lets the `<br/>` in
// the labels render.

async function renderMermaid(): Promise<void> {
  const blocks = document.querySelectorAll<HTMLElement>(
    "pre[data-language=\"mermaid\"], pre:has(> code.language-mermaid)",
  );
  if (blocks.length === 0) {
    return;
  }

  const { default: mermaid } = await import("mermaid");
  const nodes = Array.from(blocks, pre => {
    const div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = pre.textContent ?? "";
    pre.replaceWith(div);
    return div;
  });

  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
      background: "#15161A",
      primaryColor: "#1E3F8F",
      primaryTextColor: "#F4F5F8",
      lineColor: "#B9BDC9",
      fontFamily: "Schibsted Grotesk, system-ui, sans-serif",
    },
  });
  await mermaid.run({ nodes });
}

void renderMermaid();
