describe("Scenario: Recording attendance of a child - E2E test", () => {
  before(() => {
    // GIVEN A specific child is attending a specific class
    cy.visit("attendance");
  });

  // WHEN I record attendance for this class
  it("Record attendance for the class", function () {
    cy.get(".mat-card", { timeout: 10000 }).should("be.visible").eq(0).click();
    cy.contains("button", "Record").click();
  });

  // AND I set the attendance of the specific child to 'present'
  it("set the attendance of the specific child to 'present'", function () {
    cy.contains("button", "Show more").click();
    cy.contains("mat-card", "School Class")
      .eq(0)
      .click({ scrollBehavior: "center" });
    cy.get(".options-wrapper > :nth-child(1)").click();
    cy.get('[fxflex=""] > .ng-star-inserted > .mat-focus-indicator').click();
    cy.contains("button", "Save").click();
  });

  // THEN in the details page of this child under 'attendance' for the specific class I should see a green background for the current day
  it("In the details page of this child under 'attendance' for the specific class should be a green background for the current day", function () {
    cy.get(".mat-card", { timeout: 10000 })
      .should("be.visible")
      .eq(0)
      .click({ force: true });
    // Click on ChildBlock inside roll-call to navigate to child
    cy.get(".navigation-bar > :nth-child(1)").click();
    cy.get(".child-block").click();
    cy.get("#mat-tab-label-0-2").click();
    cy.get(".attendance-P").should(
      "have.css",
      "background-color",
      "rgb(200, 230, 201)"
    );
  });
});
