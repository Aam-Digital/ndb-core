describe("Scenario: Linking a child to a school - E2E test", () => {
  before(() => {


    // GIVEN I am on the details page of a child
    cy.visit("http://localhost:4200/school/1");
    cy.get(".page-header > .ng-star-inserted").invoke("text").as("schoolName");

    cy.visit("http://localhost:4200/child/1");
    cy.get(".page-header > .ng-star-inserted").invoke("text").as("studentName");
  });

  // WHEN I add an entry in the 'Previous Schools' section with a specific school
  // (with todays date - that might be added to this e2e test later)
  it("Add an entry in the Previous School section", function () {
    // get the Education button and click on it
    cy.get("#mat-expansion-panel-header-1 > .mat-content")
      .should("contain", "Education")
      .click();
    // get the Show All button and toggle it, forcing the click is needed because the element has a hidden feature
    cy.get(
      "#mat-slide-toggle-1 > .mat-slide-toggle-label > .mat-slide-toggle-bar > .mat-slide-toggle-thumb-container > .mat-slide-toggle-thumb"
    ).click({ force: true });
    // get the Add School button and click on it
    cy.get(
      "app-previous-schools.ng-star-inserted > app-entity-subrecord > .container > .mat-table > thead > .mat-header-row > .cdk-column-actions > .mat-focus-indicator"
    ).click();

    // choose the school to add
    cy.get('[ng-reflect-placeholder="Select School"]')
      .type(this.schoolName)
      .click();
    // save school in child profile
    cy.contains("button", "Save").click();
  });

  // THEN I can see that child in the 'Children Overview' of the details page of this school
  it("Check for child in Children Overview of specific school", function () {
    // Go to the school overview page
    cy.contains("mat-list-item", "Schools").click();

    // Choose the school that was added to the child profile
    cy.contains(
      "tbody > :nth-child(1) > .cdk-column-name",
      this.schoolName
    ).click();
    // Open the students overview
    cy.contains("mat-expansion-panel-header", "Students").click();

    // Here a wait function is implemented because cypress is faster then the website
    cy.wait(2000);

    // Toggle 'Show All' switch to display all students
    cy.get(".mat-slide-toggle-content").click({ force: true });

    // Check if student is in the school students list
    cy.contains(
      "#cdk-accordion-child-10 > .mat-expansion-panel-body",
      this.studentName
    );
  });
});
