[![Release Version](https://img.shields.io/github/release/Aam-Digital/ndb-core.svg)](https://github.com/Aam-Digital/ndb-core/releases)
[![Build Status](https://travis-ci.org/Aam-Digital/ndb-core.svg?branch=master)](https://travis-ci.org/Aam-Digital/ndb-core)
[![Code Climate](https://codeclimate.com/github/NGO-DB/ndb-core/badges/gpa.svg)](https://codeclimate.com/github/NGO-DB/ndb-core)
[![Test Coverage](https://api.codeclimate.com/v1/badges/4e4a7a6301064019b2c9/test_coverage)](https://codeclimate.com/github/Aam-Digital/ndb-core/test_coverage)
[![Docs](https://img.shields.io/badge/docs-by%20compodoc-blue.svg)](https://aam-digital.github.io/ndb-core/index.html)



# Aam Digital
Empowering NGOs' social workers with simple to use (database) software.

> For more information about the software and a free demo system visit **[www.aam-digital.com](https://www.aam-digital.com)**.

> You can find the Developer Documentation at **[http://aam-digital.github.io/ndb-core/](http://aam-digital.github.io/ndb-core/additional-documentation/guidelines-and-recipes.html)**

-----


# Use / Deploy
You can directly run the system using Docker.
More information in our [Aam-Digital/ndb-setup repository](https://github.com/Aam-Digital/ndb-setup/).
In that case you do not have to clone this repository and install all the dependencies as everything is packaged into the docker image already.





# Development
Our detailed documentation and API reference is hosted on GitHub Pages: [**aam-digital.github.io/ndb-core**](http://aam-digital.github.io/ndb-core/index.html).

Additionally you can find guides and recipes to implement common functionalities there in the [Developer Documentation](http://aam-digital.github.io/ndb-core/additional-documentation/guidelines-and-recipes.html).


## Setup
The project depends on a couple of tools which are required for development. Please make sure you have the following installed:
- [npm (NodeJS)](https://www.npmjs.org/)

You can simply `git clone` this repository to get all the code with its configuration and requirements.
Then install the dependencies with
```
npm install
```


## Configuration
Create a config file at `assets/config.json` by copying the default config `assets/config.default.json`.
The default config file is used as a fallback.
Adapt the settings, especially regarding the CouchDB server that should be used for server-side synchronisation.



## Using Angular CLI

### Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding (Generate new modules and components)

You can use [Angular CLI](https://angular.io/cli/generate) to add new code to the project. Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

### Build

Run `ng build -prod` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).




# Contribute
Our project is run completely by volunteers. Contributions welcome!

Please read the [Contribution Guidelines](http://aam-digital.github.io/ndb-core/first-steps/contribution-guidelines.html) in the Developer Documentation.
