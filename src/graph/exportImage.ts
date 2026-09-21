import cytoscape, { type Core } from "cytoscape";
export function snapshotGraph(cy: Core) {
  return {
    elements: cy.elements().map((item) => ({
      // Cytoscape retains these objects; another core must never share them.
      data: structuredClone(item.data()),
      position: item.isNode() ? { ...item.position() } : undefined,
      group: item.group(),
      classes: item
        .classes()
        .filter((c) => ["two-way", "self-relation", "no-label", "has-avatar"].includes(c))
        .join(" "),
    })),
    style: structuredClone(cy.json().style),
  };
}
export async function exportGraphImage(
  cy: Core,
  container: HTMLElement,
): Promise<Blob> {
  if (!cy || !cy.nodes().length)
    throw new Error("请先添加角色，再导出关系网图片。");
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-20000px;top:0;width:1600px;height:1200px;";
  document.body.append(host);
  let exported: Core | undefined;
  try {
    const css = getComputedStyle(container),
      background = css.getPropertyValue("--paper").trim();
    const snapshot = snapshotGraph(cy);
    await Promise.all([...new Set(cy.nodes().map(node => node.data('avatar')).filter(Boolean))].map(async source => {
      const image = new Image(); image.src = source; await image.decode();
    }));
    exported = cytoscape({
      container: host,
      ...snapshot,
      layout: { name: "preset", fit: false },
      pixelRatio: 1,
    });
    await document.fonts.ready;
    // Force a tiny render to start the renderer's own image cache even in a hidden window.
    exported.png({ maxWidth: 1, maxHeight: 1 });
    // The offscreen renderer loads its own images. Wait before reading the canvas.
    const imageDeadline = Date.now() + 10000;
    while (exported.nodes('.has-avatar:backgrounding').length) {
      if (Date.now() > imageDeadline) throw new Error('头像加载超时，请稍后重新导出。');
      await new Promise(resolve => setTimeout(resolve, 30));
      // Offscreen canvases do not receive regular redraws; drawing refreshes
      // Cytoscape's backgrounding flag after the image's load event.
      exported.png({ full: true, maxWidth: 1, maxHeight: 1 });
    }
    const bounds = exported.elements().boundingBox(),
      scale = Math.min(
        2,
        8000 / Math.max(bounds.w, bounds.h),
        Math.sqrt(32_000_000 / (bounds.w * bounds.h)),
      );
    return (await exported.png({
      output: "blob-promise",
      full: true,
      bg: background,
      scale,
    })) as Blob;
  } finally {
    exported?.destroy();
    host.remove();
  }
}
