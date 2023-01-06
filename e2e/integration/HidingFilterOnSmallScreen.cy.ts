describe("When on a big screen, the filter component above the entity list should be visible", () => {
  before("GIVEN that the screen is big", () => {
    cy.visit("child");
    cy.viewport("macbook-15");
  });

  it("THEN I should see filter options on a list page", () => {
    cy.get("app-filter").should("be.visible");
  });
});

describe("When on a small screen, the filter component above the entity list should not be visible", () => {
  before("GIVEN that the screen is small", () => {
    cy.visit("child");
    cy.viewport("iphone-6");
  });

  it("THEN I should not see filter options on a list page", () => {
    cy.get("app-filter").should("not.exist");
  });
});
