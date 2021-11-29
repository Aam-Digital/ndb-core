# How to write an E2E test

## Resources and How-Tos
* [Documentation](https://docs.cypress.io/guides/getting-started/writing-your-first-test)
* [Introduction to Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress)
* [Writing and Organizing Tests](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests)

## Instruction
### First Step
#### Create a file
All tests are located under `ndb-core/e2e/integration` directory. Good practice is to create for every single test his own directory. The name of test and directory should have the same name.
<br />
e.g. `/../integration/LinkingChildToSchool/LinkingChildToSchool.ts`
<br />
It does not matter how to create this file.

### Second Step
#### Gherkin Template
Create/Define a User Story with Gherkin Template. With the help of this template an e2e-test can be created step-by-step and you would not lose your attention.
<br />
e.g.
####Scenario: Linking a child to a school
```
Given I am on the details page of a child
When I add an entry in the 'Previous Schools' section with a specific school
Then I can see that child in the 'Children Overview' of the details page of this school
```
### Third Step
#### Implement E2E-Test
```
describe("Scenario of the Test", () => {
  before(() => {
  // In the before() function we can describe our start Point and specific variables
  //e.g.
    cy.visit("http://localhost:4200");
    cy.wrap("Something").as("VariableName");
  });

  // In the it() function the single tests of the test scenario can be written
  it("Add an entry in the Previous School section", function () {
    // get the specific button and click on it
    cy.get("buttonElement")
      .should("contain", "ButtonName")
      .click();
    // choose object from Dropdown menu type our Variable and click on it
    cy.get('DropdownMenu')
      .type(this.VariableName)
      .click();
  });
  
  //Write more test cases here by adding aditional it functions tags
});

```
[A solid test generally covers 3 phases](https://docs.cypress.io/guides/getting-started/writing-your-first-test#Write-a-real-test):

<ol>
<li>Set up the application state.</li>
<li>Take an action.</li>
<li>Make an assertion about the resulting application state.</li>
</ol>
