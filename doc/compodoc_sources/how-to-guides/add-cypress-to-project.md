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


## Uninstall Protractor
If the protractor is still installed, uninstall it.

1. Run `npm uninstall protractor` this uninstalls a package, completely removing everything npm installed on its behalf.
 It also removes the package from the dependencies, `devDependencies`, `optionalDependencies`, and `peerDependencies` objects in your `package.json`.
 Futher, if you have an `npm-shrinkwrap.json` or `package-lock.json`, npm will update those files as well.
2. Remove `ndb-core/protractor.conf.js` if exists.
3. Remove `ndb-core/e2e` folder if exists and all test inside, if there any.


## Recommended Installation: <br> Installing Cypress using ng 

The following resources may be helpful: 
* [Cypress Angular Schematic](https://github.com/cypress-io/cypress/tree/develop/npm/cypress-schematic)
* [Getting Started](https://docs.cypress.io/guides/migrating-to-cypress/protractor#Getting-Started)

1. Run `ng add @cypress/schematic`. This will install Cypress, add scripts for running Cypress in run and open mode,
 scaffold base Cypress files and directories.
2. It would ask you **Would you like the default _ng e2e_ command to use Cypress?** Type "Y" to accept.
3. Next Step is [configure-cypress-to-project.md]() _TODO:Add the link as soon as the documentation is written_
4. Finish
-----

## Manual Installation: <br> Installing Cypress using npm

The following resources may be helpful: 
* [Installing Cypress](https://docs.cypress.io/guides/getting-started/installing-cypress)
* [Manual Installation](https://docs.cypress.io/guides/migrating-to-cypress/protractor#Manual-Installation)


1. Run `npm install --save-dev cypress`. This will install Cypress locally as a dev dependency for your project.
2. Run `npm install --save-dev concurrently` to install [concurrently](https://www.npmjs.com/package/concurrently) to simplify our npm script so that Cypress can work with the application in parallel.
This is optional; however, you will need another way to serve your Angular app for Cypress to run tests against your application.
3. Run `node_modules\.bin\cypress open` or `npx cypress open`. When we run Cypress for the first time, it generates a bunch of examples that we can learn from, also 
it create a sub-directory named cypress with a scaffold for your tests.
4. Finish