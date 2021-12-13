describe("Scenario: Recording attendance of a child - E2E test", () => {
  before(() => {
    // GIVEN A specific child is attending a specific class
    cy.visit("http://localhost:4200/attendance/add/day");
  });

  // WHEN I record attendance for this class
  it("Record attendance for the class", function () {
    cy.get(".mat-card", { timeout: 10000 }).should("be.visible").click();
    cy.contains("button", "Record Attendance").click();
  });

  // AND I set the attendance of the specific child to 'present'
  it("set the attendance of the specific child to 'present'", function () {
    cy.get(".options-wrapper > :nth-child(1)").click();
    cy.get('[angularticsaction="rollcall_save-exit"]').click();
    cy.contains("button", "Yes").click();
    cy.contains("button", "Finish").click();
  });

  // THEN in the details page of this child under 'attendance' for the specific class I should see a green background for the current day
  it("In the details page of this child under 'attendance' for the specific class should be a green background for the current day", function () {
    cy.get(".mat-card", { timeout: 10000 }).should("be.visible").click();
    cy.contains("button", "Record Attendance").click();
    cy.get(".clickable").click();
    cy.get("#mat-expansion-panel-header-2").click();
    cy.get(":nth-child(3) > .attendance-P").should(
      "have.css",
      "background-color",
      "rgb(200, 230, 201)"
    );
  });
});
