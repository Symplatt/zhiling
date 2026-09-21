import cytoscape, { type Core } from "cytoscape";
import { graphLayoutOptions, ensureGraphSpacing } from "./layout";
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
    const elements: cytoscape.ElementDefinition[] = cy
      .elements()
      .map((item) => ({
        data: item.data(),
        position: item.isNode() ? item.position() : undefined,
        group: item.group(),
        classes: item.hasClass("two-way") ? "two-way" : "",
      }));
    exported = cytoscape({
      container: host,
      elements,
      style: cy.json().style,
      layout: { name: "preset" },
      pixelRatio: 1,
    });
    exported.elements().removeClass("hidden dimmed chosen no-label");
    exported.layout(graphLayoutOptions("fcose", exported.nodes().length)).run();
    ensureGraphSpacing(exported);
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
