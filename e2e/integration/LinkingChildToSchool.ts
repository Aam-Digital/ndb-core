describe("Scenario: Linking a child to a school - E2E test", () => {
  before(() => {
    // GIVEN I am on the details page of a child
    cy.initChildAndSchool("E2E Child", "E2E School");
  });

  // WHEN I add an entry in the 'Previous Schools' section with a specific school
  // (with todays date - that might be added to this e2e test later)
  it("Add an entry in the Previous School section", function () {
    // Click "Schools" button at navbar
    cy.get("[ng-reflect-angulartics-label=Children]").click();

    // type to the input "Filter" the name of child
    cy.get('[data-placeholder="e.g. name, age"]').type("E2E Child");

    // Click on the Child in Table list
    cy.get("tbody > :nth-child(1)").click();

    // get the Education button and click on it
    cy.contains("div", "Education").should("be.visible").click();

    // get the Add School button and click on it
    cy.get(
      "app-previous-schools.ng-star-inserted > app-entity-subrecord > .container > .mat-table > thead > .mat-header-row > .cdk-column-actions > .mat-focus-indicator"
    ).click();

    // choose the school to add
    cy.get('[ng-reflect-placeholder="Select School"]')
      .type("E2E School")
      .click();

    // save school in child profile
    cy.contains("button", "Save").click();
  });

  // THEN I can see that child in the 'Children Overview' of the details page of this school
  it("Check for child in Children Overview of specific school", function () {
    // Go to the school overview page
    // cy.contains("mat-list-item", "Schools").click();

    // Choose the school that was added to the child profile "app-previous-schools.ng-star-inserted > app-entity-subrecord"
    cy.contains(
      ":nth-child(1) > .cdk-column-schoolId > app-display-entity.ng-star-inserted > .ng-star-inserted > :nth-child(1) > .underline-on-hover",
      "E2E School"
    ).click();
    // Open the students overview
    cy.contains("div", "Students").should("be.visible").click();

    // Check if student is in the school students list
    cy.contains("app-children-overview > app-entity-subrecord", "E2E Child");
  });
});
