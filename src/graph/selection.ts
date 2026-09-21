import type { Core } from "cytoscape";
export function applyGraphVisibility(
  cy: Core,
  options: {
    group: string;
    selected: string;
    labels: boolean;
    neighborhood: boolean;
  },
) {
  if (!cy) return;
  cy.batch(() => {
    cy.elements().removeClass("dimmed chosen hidden neighbor connected");
    if (options.group) {
      cy.nodes()
        .filter((n) => (n.data("group") || "未分组") !== options.group)
        .addClass("hidden");
      cy.edges()
        .filter(
          (e) => e.source().hasClass("hidden") || e.target().hasClass("hidden"),
        )
        .addClass("hidden");
    }
    const selected = cy.getElementById(options.selected);
    if (selected.length) {
      selected.addClass("chosen");
      if (selected.isNode()) {
        selected.connectedEdges().addClass("connected");
        selected
          .neighborhood()
          .nodes()
          .difference(selected)
          .addClass("neighbor");
      }
      if (options.neighborhood)
        cy.elements()
          .difference(selected.closedNeighborhood())
          .addClass("dimmed");
    }
    cy.edges().toggleClass("no-label", !options.labels);
  });
}
