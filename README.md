[![Release Version](https://img.shields.io/github/release/Aam-Digital/ndb-core.svg)](https://github.com/Aam-Digital/ndb-core/releases)
[![Build Status](https://github.com/Aam-Digital/ndb-core/actions/workflows/master-push.yml/badge.svg)](https://github.com/Aam-Digital/ndb-core/actions/workflows/master-push.yml)
[![Code Climate](https://codeclimate.com/github/Aam-Digital/ndb-core/badges/gpa.svg)](https://codeclimate.com/github/Aam-Digital/ndb-core)
[![Test Coverage](https://api.codeclimate.com/v1/badges/4e4a7a6301064019b2c9/test_coverage)](https://codeclimate.com/github/Aam-Digital/ndb-core/test_coverage)
[![Guides](https://img.shields.io/badge/Tutorial%20%26%20Guides-20-blue)](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)
[![Doc CoverageDocs](https://aam-digital.github.io/ndb-core/documentation/images/coverage-badge-documentation.svg)](https://aam-digital.github.io/ndb-core/documentation/modules.html)
[![Known Vulnerabilities](https://snyk.io/test/github/Aam-Digital/ndb-core/badge.svg)](https://snyk.io/test/github/Aam-Digital/ndb-core)

# Aam Digital
Empowering social workers with simple to use software.

> For more information about the software and a free demo system visit **[www.aam-digital.com](https://www.aam-digital.com)**.

> For more information about the code including guides see the separate **[Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)**

-----

# Installation, Use & Deployment
You can directly run the system using Docker.
More information in our [Aam-Digital/ndb-setup repository](https://github.com/Aam-Digital/ndb-setup/).
In that case you do not have to clone this repository and install all the dependencies as everything is packaged into the docker image already.

## Configuration
The custom configuration for your service instance is set in the `assets/config.json` file.
You can copy the `assets/config.default.json` as a starting point.

### Nextcloud (webdav) Integration
You can integrate Aam Digital with an existing Nextcloud server to allow users to update photos on their own.
To avoid CORS issues the webdav URL in your _config.json_ should be a relative URL
in combination with a reverse-proxy that is forwarding to the actual Nextcloud server address:

_assets/config.json:_
```
  "webdav": {
    "remote_url": "nextcloud/"
  }
```

_proxy.conf.json_ (for local development):
```
  "/nextcloud": {
    "target": "https://<your-nextcloud-server>/remote.php/webdav",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/nextcloud": ""
    }
  }
```

_docker-compose.yml_ (for production server):
```
  environment:
    WEBDAV_URL: https://<your-nextcloud-server>/remote.php/webdav
```

-----

# Development

## Setup
1. This project depends on [npm (NodeJS)](https://www.npmjs.org/) to setup its dependencies. Please make sure you have npm installed.
2. `git clone` this repository to get all the code with its configuration and requirements.
3. `npm install` the dependencies (external libraries and packages) 
4. create a config file `assets/config.json` by copying the default config `assets/config.default.json` that is part of the repository.
5. `npm run start` to run your local dev server and get started.

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
