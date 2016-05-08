# NGO DB
Empowering NGOs' social workers with simple to use (database) software.

For a project outline, free demo system, etc. visit [ngo-db.sinnfragen.org](http://ngo-db.sinnfragen.org/)

> This is an Angular2/Typescript based rewrite of [HELGO DB](https://github.com/NGO-DB/helgo_db)


## Installation
The project depends on a couple of tools which are required for development. Please make sure you have the following installed:
- [npm (NodeJS)](https://www.npmjs.org/)
- [bower](http://bower.io)

You can simply clone this repository to get all the code with its configuration and requirements.
Install the dependencies with
```
npm install
```

You can then start npm's local development server to run the project with
```
npm start
```


## Architecture
This is a rough sketch of the architecture of the core system under discussion:
![](doc/architecture_core.png)

An actual, specific software system to be used will be based on the core and extend it:
![](doc/architecture_concrete-project.png)
