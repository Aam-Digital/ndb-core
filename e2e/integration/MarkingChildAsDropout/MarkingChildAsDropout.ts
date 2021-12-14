describe("Scenario: Marking a child as dropout - E2E test", () => {
  before(() => {
    // GIVEN I am on the details page of a specific child
    // go to the url with the Child
    cy.visit("child/1");
    // save the name of this Child to the variable
    cy.get(".page-header > .ng-star-inserted").invoke("text").as("childName");
  });

  // WHEN I select a dropout date for this child
  it("Select a dropout date for the child", function () {
    // click on "Dropout" menu
    cy.contains("Dropout").click();
    // click on button with the content "Edit" in Dropout menu.
    cy.get('[ng-reflect-columns="dropoutDate,dropoutType,dropou"]')
      .contains("Edit")
      .click();
    // type to the Dropout Date some date. It could be 12/12/2021 or something else
    cy.get('[ng-reflect-name="dropoutDate"]').type("12/12/2021");
    // click on button with the content "Save"
    cy.contains("button", "Save").click();
  });

  // THEN I should not see this child in the list of all children at first
  it("This child is not in the list of all children at first", function () {
    // click on "Children" menu in navigation
    cy.get('[ng-reflect-angulartics-label="Children"]').click();
    // type to the input "Filter" the name of child
    cy.get('[ng-reflect-placeholder="Filter"]').type(this.childName);
    // find at this table the name of child and it should not exist
    cy.get('[ng-reflect-columns-to-display="projectNumber,name,age,schoolC"]')
      .contains(this.childName)
      .should("not.exist");
  });

  // AND I should see the child when I activate the 'inactive' filter
  it("The child is seen when the 'inactive' filter activated", function () {
    // click on the button with the content "Inactive"
    cy.contains("button", "Inactive").click();
    // find at this table the name of child and it should exist
    cy.get('[ng-reflect-columns-to-display="projectNumber,name,age,schoolC"]')
      .contains(this.childName)
      .should("exist");
  });
});
