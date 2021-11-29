# How to add Cypress to project

## Motivation

Up until Angular version 12, Protractor was the default end-to-end testing framework in projects created with Angular CLI. 
Since Angular 12, **[Protractor is deprecated](https://github.com/angular/protractor/issues/5502)**.

Cypress is an end-to-end testing framework that is not based on WebDriver. There are no Angular-specific features. Any web site can be tested with Cypress.

Cypress uses the [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/) libraries for writing tests.

Cypress only supports Firefox as well as Chromium-based browsers like Google Chrome and Microsoft Edge. It does not support Safari, legacy Edge or even Internet Explorer.

Some information about Cypress:
* [Cypress](https://www.cypress.io/)
* [Why Cypress?](https://docs.cypress.io/guides/overview/why-cypress)
* [Key Differences](https://docs.cypress.io/guides/overview/key-differences)
* [Migrating from Protractor to Cypress](https://docs.cypress.io/guides/migrating-to-cypress/protractor)


## How to install Cypress

By using the npm install or npm ci command cypress will be automatically installed with all the necessary dependencies. No further actions need to be done.

## How to use Cypress for E2E tests

Using the ng e2e command, Cypress will be started in headless terminal mode. All written tests will be executed and their results will be shown in the terminal window.

Using the npm run e2e-open command, Cypress will be started in a browser mode with an additional UI to track the single e2e tests. With the help of the UI it is possible to have a better overview for the single E2E tests and further on to have the possibility of finding every element of a certain angular component.

## [How to write an E2E test](./create-e2e-test.md)

