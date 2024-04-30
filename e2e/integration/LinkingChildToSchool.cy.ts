describe("Scenario: Linking a child to a school - E2E test", function () {
  before("GIVEN I am on the details page of a child", function () {
    cy.visit("");
    cy.create("Children", "E2E Child");
    cy.create("Schools", "E2E School");
    cy.get("[ng-reflect-angulartics-label=Children]").click();
  });

  it("WHEN I add an entry in the 'Previous Schools' section with a specific school", function () {
    // type to the input "Filter" the name of child
    cy.get('[placeholder="e.g. name, age"]').type("E2E Child");

    // Click on the Child in Table list
    cy.get("tbody > :nth-child(1)").click();

    // get the Education button and click on it
    cy.contains("div", "Education").should("be.visible").click();

    // get the Add School button and click on it
    cy.contains("div", "School History")
      .get('[icon="plus-circle"]')
      .first()
      .should("be.visible")
      .click();

    // choose the school to add
    cy.contains("mat-form-field", "School")
      .find("[matInput]:visible")
      .type("E2E School{enter}");

    // save school in child profile
    cy.contains("button", "Save").click({ force: true });
    // wait for the popup-close animation
    cy.wait(100);
  });

  it("THEN I can see that child in the 'Children Overview' of the details page of this school", function () {
    // Click on the school that was added to the child profile
    cy.contains("span", "E2E School").click();
    // Open the students overview
    cy.contains("div", "Students").should("be.visible").click();

    // Check if student is in the school students list
    cy.contains(
      "app-child-school-overview > app-entity-subrecord",
      "E2E Child",
    );
  });
});
