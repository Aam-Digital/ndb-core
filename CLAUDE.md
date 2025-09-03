# Aam Digital - Project Context

## Project Overview
Aam Digital is a comprehensive case management software for social organizations, designed to improve effectiveness and transparency in work with beneficiaries. It's built with Angular 20 and uses TypeScript, Material Design, and various modern web technologies.

## Architecture & Tech Stack
- **Frontend**: Angular 20, TypeScript, Angular Material
- **State Management**: RxJS, Entity system with PouchDB
- **Authentication**: Keycloak integration
- **Database**: PouchDB (CouchDB compatible) with offline-first approach
- **Testing**: Jasmine, Karma, Playwright for E2E
- **Documentation**: Compodoc for API docs
- **Build & Deploy**: Angular CLI, Docker

## Key Features
- Entity-based data modeling system
- Offline-first architecture with sync capabilities
- Multi-language support (i18n) via POEditor
- Flexible configuration system
- Dashboard widgets and reporting
- Import/export functionality
- Permission-based access control
- Demo data generation for testing

## Project Structure
- `src/app/core/` - Core system modules and services
- `src/app/features/` - Feature-specific modules
- `src/app/child-dev-project/` - Child development specific features
- `e2e/` - End-to-end tests with Playwright
- `doc/` - Documentation and API reference
- `build/` - Build configuration and scripts

## Development Guidelines
- Uses ESLint for linting (`npm run lint`)
- Prettier for code formatting (pre-commit hooks)
- Comprehensive test suite with Karma and Playwright
- TypeScript strict mode enabled
- Material Design components preferred
- Entity-based architecture for data models

## Key Commands
- `npm run start` - Start development server
- `npm run build` - Production build
- `npm run test` - Unit tests
- `npm run e2e` - End-to-end tests with Playwright
- `npm run e2e:debug` - Run E2E tests in debug UI mode
- `npm run lint` - Run linting
- `npm run compodoc` - Generate documentation

## End-to-End Testing Guidelines
For detailed e2e testing patterns and best practices, use the `/write-e2e-test` command.

## Entity System
The application uses a sophisticated entity system where:
- All data models extend the base Entity class
- Entities have configurable schemas and properties
- Supports various datatypes (Date, ConfigurableEnum, etc.)
- Built-in support for permissions and validation
- Automatic change tracking and sync capabilities

## Configuration-Driven
The platform is highly configurable through JSON configuration files, allowing customization without code changes. This includes:
- Entity definitions and field configurations
- Dashboard layouts and widgets
- Navigation menus and views
- Reports and data exports
