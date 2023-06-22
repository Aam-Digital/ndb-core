// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Create a child or school with the given name
     * @param menuItem name e.g. 'Children' or 'Schools' where a entity should be created
     * @param name of the entity that should be created
     */
    create(menuItem: string, name: string): typeof create;
  }
}

function create(menuItem: string, name: string): void {
  cy.get(`[ng-reflect-angulartics-label="${menuItem}"]`).click();
  cy.contains("button", "Add New").click();
  cy.contains("mat-label", "Name").type(name);
  cy.contains("button", "Save").click();
}

//
// NOTE: You can use it like so:
Cypress.Commands.add("create", create);
// Overwriting default visit function to wait for index creation
Cypress.Commands.overwrite("visit", (originalFun, url, options) => {
  originalFun(url, options);
  cy.get("app-search", { timeout: 20000 }).should("be.visible");
  // wait for demo data generation
  cy.contains("button", "Continue in background", { timeout: 20000 }).should(
    "exist"
  );
  cy.contains("button", "Continue in background", { timeout: 10000 }).should(
    "not.exist"
  );
});

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
