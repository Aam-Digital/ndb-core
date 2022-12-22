describe("When on a big screen, the filter component above the entity list should be visible", () => {
  before("GIVEN that the screen is big", () => {
    cy.visit("");
    cy.viewport("macbook-15");
  });

  it("WHEN I am on an entities page", () => {
    cy.get(
      '[ng-reflect-angulartics-label="Children"] > .mat-list-item-content'
    ).click();
  });

  it("THEN I should see filter options", () => {
    cy.get("app-filter").should("be.visible");
  });
});

describe("When on a small screen, the filter component above the entity list should not be visible", () => {
  before("GIVEN that the screen is small", () => {
    cy.visit("");
    cy.viewport("iphone-6");
  });

  it("WHEN I am on an entities page", () => {
    cy.get(":nth-child(1) > .ng-star-inserted > .mat-focus-indicator").click();
    cy.get(
      '[ng-reflect-angulartics-label="Children"] > .mat-list-item-content'
    ).click();
  });

  it("THEN I should not see filter options", () => {
    cy.get("app-filter").should("not.be.visible");
  });
});
