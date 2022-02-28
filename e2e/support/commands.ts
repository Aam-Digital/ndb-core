// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
declare namespace Cypress {
  interface Chainable<Subject = any> {
    createChild(name: string): typeof createChild;
    createSchool(name: string): typeof createSchool;
    initChildAndSchool(
      nameChild: string,
      nameSchool: string
    ): typeof initChildAndSchool;
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
// ***********************************************
//  function initChildAndSchool
//
//  brief:  This functions create new child and new School.
//          It can be used at the beginning of a test to avoid failing tests.
//          Caution, this function can be a reason for failing tests in some cases.
//
//  1 param: String, name of Child
//  2 param: String, name of School
//
//  return: void
// ***********************************************
function initChildAndSchool(nameChild: string, nameSchool: string): void {
  // go to url to add new Child
  cy.visit("child/new");
  // Type Child Name to the Input "Name"
  cy.get("[ng-reflect-placeholder=Name]").type(nameChild);
  // Click the "Save" button
  cy.contains("button", "Save").click();
  // Click "Schools" button at navbar
  cy.get("[ng-reflect-angulartics-label=Schools]").click();
  // Click "Add New" button
  cy.get("[angularticsaction=list_add_entity]").should("be.visible").click();
  // Type School Name to the Input "Name"
  cy.get("[ng-reflect-placeholder=Name]").type(nameSchool);
  // Click the "Save" button
  cy.contains("button", "Save").click();
}
//
// NOTE: You can use it like so:
Cypress.Commands.add("createChild", createChild);
Cypress.Commands.add("createSchool", createSchool);
Cypress.Commands.add("initChildAndSchool", initChildAndSchool);
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
