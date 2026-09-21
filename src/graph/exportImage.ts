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
        .filter((c) => ["two-way", "self-relation", "no-label"].includes(c))
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
    exported = cytoscape({
      container: host,
      ...snapshot,
      layout: { name: "preset", fit: false },
      pixelRatio: 1,
    });
    await document.fonts.ready;
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
