describe("Scenario: Recording attendance of a child - E2E test", function () {
  before("GIVEN A specific child is attending a specific class", function () {
    cy.visit("attendance");
  });

  it("WHEN I record attendance for this class", () => {
    cy.get(".mat-card", { timeout: 10000 }).should("be.visible").eq(0).click();
    cy.contains("button", "Record").click();
  });

  it("AND I set the attendance of the specific child to 'present'", function () {
    cy.contains("button", "Show more").click({ scrollBehavior: "center" });
    cy.contains("mat-card", "School Class")
      .eq(0)
      .click({ scrollBehavior: "center" });
    cy.get(".mat-body-1").invoke("text").as("childName");
    cy.get(".group-select-option").contains("Present").click();
    cy.get('[fxflex=""] > .ng-star-inserted > .mat-focus-indicator').click();
    cy.contains("button", "Save").click();
  });

  it("THEN in the details page of this child under 'attendance' for the specific class I should see a green background for the current day", function () {
    cy.get("#mat-input-2")
      .focus()
      .type(this.childName)
      .wait(500)
      .type("{downArrow}")
      .type("{enter}");
    cy.get("#mat-tab-label-0-2").click();
    cy.get(".mat-calendar-body-active").should(
      "have.css",
      "background-color",
      "rgb(200, 230, 201)"
    );
  });
});
