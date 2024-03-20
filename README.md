[![Release Version](https://img.shields.io/github/release/Aam-Digital/ndb-core.svg)](https://github.com/Aam-Digital/ndb-core/releases)
[![Build Status](https://github.com/Aam-Digital/ndb-core/actions/workflows/master-push.yml/badge.svg)](https://github.com/Aam-Digital/ndb-core/actions/workflows/master-push.yml)
[![Code Climate](https://codeclimate.com/github/Aam-Digital/ndb-core/badges/gpa.svg)](https://codeclimate.com/github/Aam-Digital/ndb-core)
[![Test Coverage](https://api.codeclimate.com/v1/badges/4e4a7a6301064019b2c9/test_coverage)](https://codeclimate.com/github/Aam-Digital/ndb-core/test_coverage)
[![E2E Tests](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/2petka/master&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/2petka/runs)
[![Guides](https://img.shields.io/badge/Tutorial%20%26%20Guides-available-blue)](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)
[![Known Vulnerabilities](https://snyk.io/test/github/Aam-Digital/ndb-core/badge.svg)](https://snyk.io/test/github/Aam-Digital/ndb-core)

# Aam Digital
*Enabling social organizations digitally to transform lives.*

Aam Digital is an easy-to-use case management software for the social sector that improves the effectiveness and transparency of work with beneficiaries in the field.

<div align="center"><img src="https://github.com/Aam-Digital/ndb-core/assets/1682541/2b125750-5c03-4dc7-873f-22d8278accde"  width="30%"></div>

> For more information about the software and an open demo system visit **[www.aam-digital.com](https://www.aam-digital.com)**.

> For more information about the code including guides see the separate **[Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)**

-----

# Installation, Use & Deployment
You can directly run the system using Docker.
More information in our [Aam-Digital/ndb-setup repository](https://github.com/Aam-Digital/ndb-setup/).
In that case you do not have to clone this repository and install all the dependencies as everything is packaged into the docker image already.

The Aam Digital platform can be customized for different use cases through a flexible configuration file. This doesn't require changes to the generic platform code base in this repository:
![image](https://github.com/Aam-Digital/ndb-core/assets/1682541/c9b08c0b-bb60-464d-b39f-703ae2995213)

The overall architecture and tech stack including backend services looks like this:
![image](https://github.com/Aam-Digital/ndb-core/assets/1682541/557adb8a-df93-4c83-b547-8a5e28650324)


# Development

## Setup
1. This project depends on [npm (NodeJS)](https://www.npmjs.org/) to setup its dependencies. Please make sure you have npm installed.
2. `git clone` this repository to get all the code with its configuration and requirements.
3. `npm install` the dependencies (external libraries and packages) 
4. `npm run start` to run your local dev server and get started.

By default the app is started with a "mock" session, generating demo data into an in-memory database.
You can change this mode by editing the environment.ts
(or create a file assets/config.json to overwrite settings; that file is on the .gitignore list).

Use the dockerized local environment to run a fully synced app including backend services on your machine:
https://github.com/Aam-Digital/aam-services/tree/main/docs/developer

## Documentation
Our detailed [Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)
provides tutorials, guides, concepts and an API reference.

## Code Style
We use _prettier_ to enforce a consistent formatting of code to make the project easier to read.
The project is set up with a git pre-commit hook to automatically format your commits according to these rules.


## Using Angular CLI
This project is built upon [Angular](https://angular.io/).
If you are unfamiliar with the framework and Angular CLI go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md) or use use `ng help`.
The following sections give you a brief overview.

### Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding (Generate new modules and components)

You can use [Angular CLI](https://angular.io/cli/generate) to add new code to the project. Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

### Build

Run `ng build -prod` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Cypress](http://www.cypress.io/) in the terminal.

Run `npm run e2e-open` to execute the end-to-end tests via Cypress own User Interface.


### Build a docker image locally
Deployment on a server can be done through a docker image, our [ndb-setup project](https://github.com/Aam-Digital/ndb-setup) provides tools and a starting point to run the system using docker.
For more information about Docker, please refer to [their official documentation](https://docs.docker.com/get-started/).

To learn more about the build process, see [/build](./build/README.md).

-----

# Contribute
Our project is completely run by volunteers. Contributions welcome!

We are trying hard to make it easy for you to join in.
As a starting point, please refer to our **[CONTRIBUTING](./CONTRIBUTING.md)** page.
