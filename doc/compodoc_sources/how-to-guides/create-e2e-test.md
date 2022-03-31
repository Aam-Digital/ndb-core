# How to write an E2E test

## Resources and How-Tos
* [Documentation](https://docs.cypress.io/guides/getting-started/writing-your-first-test)
* [Introduction to Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress)
* [Writing and Organizing Tests](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests)

## Instruction
### First Step
#### Create a file
All tests are located under `ndb-core/e2e/integration` directory. 
<br />
File extension could be `.spec.ts` or just `.ts`
<br />
You can use any tool in your operating system to create the file, or you can use the `ng generate @cypress/schematic:e2e` command

In order to bypass the prompt asking for your e2e spec name, simply add a `--name=` flag like this:
<br />
`ng generate @cypress/schematic:e2e --name=login`
<br />
This will create a new spec file named `login.spec.ts` in the default Cypress folder location(`ndb-core/cypress/integration`).

**Specify Path for command**
<br />
Add a `--path=` flag to specify the project:
<br />
`ng generate @cypress/schematic:e2e --name=login --path=e2e/integration`
<br />
This will create the e2e spec file in your specific location, creating folders as needed.

**Specify Project for command**
<br />
Add a `--project=` flag to specify the project:
<br />
`ng generate @cypress/schematic:e2e --name=login --project=ndb-core-e2e`

If you have tests that fit together, create a separate folder inside for them. This grouping will help you navigate through them better.
<br />
e.g. `/../integration/childTests/`
<br />

### Second Step
#### Gherkin Template
##### How does Gherkin help with writing Cypress tests?

As a barely formal language, Gherkin primarily serves as a communication language in agile teams for describing system behaviour based on the concrete examples and thus supports the following goals:

- Creation of understandable and executable specification for all stakeholders in agile teams.
- Starting point for the automation of tests
- Documentation of the system behaviour
<br />

More about Gherkin: [Gherkin](https://cucumber.io/docs/gherkin/)

The specification of the scenarios with Gherkin is normally stored in so-called Feature Files. These files are human-readable text files.
<br />
It makes sense to use [cypress-cucumber-preprocessor](https://github.com/TheBrainFamily/cypress-cucumber-preprocessor) in the future (status 24.03.2022: Not in use).
<br />
This or a similar framework can speed up test creation because it allows Feature Files to be interpreted into Cypress code
#### Example of a test:
```
Scenario: Linking a child to a school
Given I am on the details page of a child
When I add an entry in the 'Previous Schools' section with a specific school
Then I can see that child in the 'Children Overview' of the details page of this school
```

Gherkin uses a set of special keywords to give structure and meaning to executable specifications.
<br />
The primary keywords are:
- Given 
- When
- Then 
- And 
- But

More info here: [Keywords](https://cucumber.io/docs/gherkin/reference/#keywords)




### Third Step
#### Implement E2E-Test

##### Some useful links
* [API: Table of Contents](https://docs.cypress.io/api/table-of-contents)
* [Setup and Teardown: Hooks](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Hooks)
* [Cookies](https://docs.cypress.io/api/cypress-api/cookies)
* [Assertions](https://docs.cypress.io/guides/references/assertions)
* [Catalog of Events](https://docs.cypress.io/api/events/catalog-of-events)
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

##### What role does Gherkin play?

We take this Scenario as example:
```
Scenario: Linking a child to a school
Given I am on the details page of a child
When I add an entry in the 'Previous Schools' section with a specific school
Then I can see that child in the 'Children Overview' of the details page of this school
```
Separate it into separate parts:

`Given I am on the details page of a child`
<br />
`When I add an entry in the 'Previous Schools' section with a specific school`
<br />
`Then I can see that child in the 'Children Overview' of the details page of this school`


We can build this template:
```
describe("Linking a child to a school", () => {
  before(() => {
  
  });

  it("I add an entry in the 'Previous Schools' section with a specific school", function () {
      
  });
  
  it("I can see that child in the 'Children Overview' of the details page of this school", function () {
      
  });
  
});
```
Now it is worth deciding how to achieve each of the goals we have described in each part. As example the `before()` section would fit perfectly with ``Given I am on the details page of a child``.

### How to use the Cypress interface

Run `npm run e2e-open` command from project root to open Cypress in "Open-Mode". This will start the [browser](https://docs.cypress.io/guides/guides/launching-browsers) with Cypress Interface.
This Interface is called [Test Runners](https://docs.cypress.io/guides/core-concepts/test-runner), that allows you to see commands as they execute while also viewing the application under test.

Run the test you are currently working on. It is recommended to use [Selector Playground](https://docs.cypress.io/guides/core-concepts/test-runner#Selector-Playground) to search for items in the DOM.

### Aam Digital specific best practices
TBD.
