// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
declare namespace Cypress {
  interface Chainable<Subject = any> {
    createChild(name: string): typeof createChild;
    createSchool(name: string): typeof createSchool;
  }
}

function createChild(name: string): void {
  cy.visit("child/new");
  cy.get('[ng-reflect-name="name"]').type(name);
  cy.contains("button", "Save").click();
}

function createSchool(name: string): void {
  cy.visit("school/new");
  cy.get('[ng-reflect-name="name"]').type(name);
  cy.contains("button", "Save").click();
}
//
// NOTE: You can use it like so:
Cypress.Commands.add('createChild', createChild);
Cypress.Commands.add('createSchool', createSchool);
//
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
