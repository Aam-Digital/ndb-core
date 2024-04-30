# How to write an End-to-End (E2E) test

## Resources and How-Tos

- [Documentation](https://docs.cypress.io/guides/getting-started/writing-your-first-test)
- [Introduction to Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress)
- [Writing and Organizing Tests](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests)

## Instructions

### 1. Create a file

#### Manually

All tests are located under `ndb-core/e2e/integration` directory.
Create a file with the ending `.spec.ts` or just `.ts`

#### With command

Cypress offers a command line tool that automatically creates a test file with a minimal setup for you.
In order to create a test called `loging` run:

> ng generate @cypress/schematic:e2e --name=login --path=e2e/integration

#### Organizing tests

If you have tests that fit together, create a separate folder inside for them.
This grouping will help you navigate through them better, e.g. `/../integration/child-tests/`

### 2. Gherkin Template

#### What is Gherkin and how does it help writing E2E tests

Gherkin is a formal language that primarily serves as a communication language in agile teams for describing system behaviour based on the concrete examples and thus supports the following goals:

- Creation of understandable and executable specification for all stakeholders in agile teams.
- Starting point for the automation of tests
- Documentation of the system behaviour

More about Gherkin: [Gherkin](https://cucumber.io/docs/gherkin/)

#### Example of a test description:

```
Scenario: Linking a child to a school
Given I am on the details page of a child
When I add an entry in the 'Previous Schools' section with a specific school
Then I can see that child in the 'Children Overview' of the details page of this school
```

Gherkin uses a set of special keywords to give structure and meaning to executable specifications.

The primary keywords are:

- Given
- When
- Then
- And
- But

More info here: [Keywords](https://cucumber.io/docs/gherkin/reference/#keywords)

Each action from Gherkin is written in the test description (e.g. `it("<description>", function{})`).

### 3. Write an E2E-Test

#### Some useful links

- [API: Table of Contents](https://docs.cypress.io/api/table-of-contents)
- [Setup and Teardown: Hooks](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Hooks)
- [Assertions](https://docs.cypress.io/guides/references/assertions)
- [Catalog of Events](https://docs.cypress.io/api/events/catalog-of-events)

#### Example

```
describe("Scenario of the Test", () => {
  before("Given I am at login page", function () {
  // In the before() function we can describe our start Point and specific variables
  //e.g.
    cy.visit("http://localhost:4200");
    cy.wrap("Something").as("VariableName");
    ...
  });

  // In the it() function the single tests of the test scenario can be written
  it("When I add an entry in the Previous School section", function () {
    // get the specific button and click on it
    cy.get("buttonElement")
      .should("contain", "ButtonName")
      .click();
    // choose object from Dropdown menu type our Variable and click on it
    cy.get('DropdownMenu')
      .type(this.VariableName)
      .click();
      ...
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

#### What role does Gherkin play?

We take the previous Scenario as example:

```
Scenario: Linking a child to a school
Given I am on the details page of a child
When I add an entry in the 'Previous Schools' section with a specific school
Then I can see that child in the 'Children Overview' of the details page of this school
```

We can translate this into the following template:

```
describe("Scenario: Linking a child to a school", () => {
  before("Given I am on the details page of a child", function() {

  });

  it("When I add an entry in the 'Previous Schools' section with a specific school", function () {

  });

  it("Then I can see that child in the 'Children Overview' of the details page of this school", function () {

  });

});
```

Now the `before(...)` and `it(...)` blocks should be filled with the code that corresponds to the according description.

### 4. Run the E2E-Tests

To open Cypress in the "Open-Mode" run the following command from the project root.

> npm run e2e-open

This will start the [browser](https://docs.cypress.io/guides/guides/launching-browsers) with the Cypress Interface.
This Interface is called [Test Runner](https://docs.cypress.io/guides/core-concepts/test-runner) where you can select the tests to be executed and interactively follow and debug the test execution.

The [Selector Playground](https://docs.cypress.io/guides/core-concepts/test-runner#Selector-Playground) is also available in the interface, which is a useful tool to write new tests by selecting items in the DOM.

The tests are also executed in each pull-request.
The check with the name `Pipeline / run-e2e-tests (pull_request)` indicates whether the E2E tests were successful.

### Aam Digital specific best practices

TBD.

### Outlook: Better Gherkin integration

The specification of the scenarios with Gherkin is normally stored in so-called Feature Files.
These files are human-readable text files.
It makes sense to use [cypress-cucumber-preprocessor](https://github.com/TheBrainFamily/cypress-cucumber-preprocessor) in the future.
This or a similar framework can speed up test creation because it allows Feature Files to be interpreted into Cypress code
