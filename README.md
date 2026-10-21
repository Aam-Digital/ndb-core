[![Release Version](https://img.shields.io/github/release/Aam-Digital/ndb-core.svg)](https://github.com/Aam-Digital/ndb-core/releases)
[![DPG Badge](https://img.shields.io/badge/Verified-DPG-3333AB?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMzEiIGhlaWdodD0iMzMiIHZpZXdCb3g9IjAgMCAzMSAzMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjIwMDggMjEuMzY3OEwxMC4xNzM2IDE4LjAxMjRMMTEuNTIxOSAxNi40MDAzTDEzLjk5MjggMTguNDU5TDE5LjYyNjkgMTIuMjExMUwyMS4xOTA5IDEzLjYxNkwxNC4yMDA4IDIxLjM2NzhaTTI0LjYyNDEgOS4zNTEyN0wyNC44MDcxIDMuMDcyOTdMMTguODgxIDUuMTg2NjJMMTUuMzMxNCAtMi4zMzA4MmUtMDVMMTEuNzgyMSA1LjE4NjYyTDUuODU2MDEgMy4wNzI5N0w2LjAzOTA2IDkuMzUxMjdMMCAxMS4xMTc3TDMuODQ1MjEgMTYuMDg5NUwwIDIxLjA2MTJMNi4wMzkwNiAyMi44Mjc3TDUuODU2MDEgMjkuMTA2TDExLjc4MjEgMjYuOTkyM0wxNS4zMzE0IDMyLjE3OUwxOC44ODEgMjYuOTkyM0wyNC44MDcxIDI5LjEwNkwyNC42MjQxIDIyLjgyNzdMMzAuNjYzMSAyMS4wNjEyTDI2LjgxNzYgMTYuMDg5NUwzMC42NjMxIDExLjExNzdMMjQuNjI0MSA5LjM1MTI3WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==)](https://digitalpublicgoods.net/r/aam-digital)
[![User Support Center](https://img.shields.io/badge/User%20Support%20Center-available-blue)](https://chatwoot.help/hc/aam-digital/en)

![English](https://img.shields.io/poeditor/progress/740876/en?token=df0ad216f2202ce5d46358c3f27af8e1)
![French](https://img.shields.io/poeditor/progress/740876/fr?token=df0ad216f2202ce5d46358c3f27af8e1)
![German](https://img.shields.io/poeditor/progress/740876/de?token=df0ad216f2202ce5d46358c3f27af8e1)
![Spanish](https://img.shields.io/poeditor/progress/740876/es?token=df0ad216f2202ce5d46358c3f27af8e1)
![Arabic](https://img.shields.io/poeditor/progress/740876/ar?token=df0ad216f2202ce5d46358c3f27af8e1)

[<img src="https://argos-ci.com/badge-large.svg" alt="Covered by Argos Visual Testing" height="20" />](https://argos-ci.com?utm_source=aam-digital&utm_campaign=oss)
[![Maintainability](https://qlty.sh/gh/Aam-Digital/projects/ndb-core/maintainability.svg)](https://qlty.sh/gh/Aam-Digital/projects/ndb-core)
[![Code Coverage](https://qlty.sh/gh/Aam-Digital/projects/ndb-core/coverage.svg)](https://qlty.sh/gh/Aam-Digital/projects/ndb-core)
[![Known Vulnerabilities](https://snyk.io/test/github/Aam-Digital/ndb-core/badge.svg)](https://snyk.io/test/github/Aam-Digital/ndb-core)
[![Developer Guides](https://img.shields.io/badge/Tutorial%20%26%20Guides-available-blue)](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)

# Aam Digital

_Enabling social organizations digitally to transform lives._

Aam Digital is an easy-to-use case management software for the social sector that improves the effectiveness and transparency of work with beneficiaries in the field.

<div align="center"><img src="https://github.com/Aam-Digital/ndb-core/assets/1682541/2b125750-5c03-4dc7-873f-22d8278accde"  width="30%"></div>

> For more information about the software and an open demo system visit **[www.aam-digital.com](https://www.aam-digital.com)**.

> For more information about the code including guides see the separate **[Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)**

---

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

1. This project depends on [npm (NodeJS)](https://www.npmjs.org/) to setup its dependencies. Please make sure you have npm installed. The Node.js version used in CI is in [`.nvmrc`](./.nvmrc) (with [nvm](https://github.com/nvm-sh/nvm): `nvm use`); CI uses the npm that comes with it.
2. `git clone` this repository to get all the code with its configuration and requirements.
3. `npm install` the dependencies (external libraries and packages)
4. `npm run start` to run your local dev server and get started.

By default, the app is started with a "mock" session, generating demo data into an in-memory database.
You can change this mode by editing the environment.ts
(or create a file assets/config.json to overwrite settings; that file is on the .gitignore list).

If you need to develop in an advanced environment including local backend services,
please refer to the instructions at [Aam-Digital/aam-services/docs/developer](https://github.com/Aam-Digital/aam-services/tree/main/docs/developer).

## Documentation

Our detailed [Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html)
provides tutorials, guides, concepts and an API reference.

### Module-level documentation

Core modules have technical `README.md` files in their directories
for developers and agents to avoid expensive code exploration.
These provide architecture overviews, file organization, key concepts, and patterns specific to that module.

For example:

- [Entity system](src/app/core/entity/README.md) — entity base class, schema, load/save, lifecycle actions
- [Configuration system](src/app/core/config/README.md) — how the JSON config drives views, menus and entities
- [Permissions module](src/app/core/permissions/README.md) — CASL-based role/permission enforcement

## Translations (internationalization; i18n)

Aam Digital is available in multiple languages.
We translate the terms using POEditor: [Join the translation team](https://poeditor.com/join/project/CGn4IA7Ilz)

To commit latest translations to the codebase, trigger the manual GitHub Action in the repository.

## Code Style

We use _prettier_ to enforce a consistent formatting of code to make the project easier to read.
The project is set up with a git pre-commit hook to automatically format your commits according to these rules.

## Using Angular CLI

This project is built upon [Angular](https://angular.io/).
If you are unfamiliar with the framework and Angular CLI go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md) or use `ng help`.

## Design & UX

We have a Design System built in Figma with various building blocks for quick mockups:

[Figma: Aam Digital - Design System](https://www.figma.com/design/oidwTceA61l9HIQWd0EQGe/Aam-Digital-%E2%80%94-Design-System--Community--?t=9ygKUCpc5nSsQxxi-0)

## Build a docker image locally

Deployment on a server can be done through a docker image, our [ndb-setup project](https://github.com/Aam-Digital/ndb-setup) provides tools and a starting point to run the system using docker.
For more information about Docker, please refer to [their official documentation](https://docs.docker.com/get-started/).

To learn more about the build process, see [/build](./build/README.md).

---

# AI-Assisted Development

This project supports AI-assisted development through GitHub Copilot, Claude Code, and CodeRabbit.

| Tool                         | Usage                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub Copilot** (VS Code) | Code generation, chat, agent mode — reads `AGENTS.md`. Use **Plan mode** for architecture planning before implementation.                           |
| **Claude Code** (CLI)        | Interactive coding assistant — reads `AGENTS.md` (do not add a `CLAUDE.md`, it would replace `AGENTS.md`)                                           |
| **CodeRabbit** (GitHub)      | On-demand PR reviews — configured via `.coderabbit.yaml`. Comment **"@coderabbitai review"** on a PR to trigger a review (auto-review is disabled). |

## Skills

Shared skills are defined in `.claude/skills/`. Claude Code picks the matching one from what you ask
(e.g. "can you do a code review of PR 4526"), or you call it by name (e.g. `/review-pull-request 4526`).
A feature usually goes through them in this order: use cases, prototype, plan, then the code, then the review.

| Skill                 | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `feature-use-cases`   | Write the use cases for a new feature                          |
| `design-prototype`    | Build a clickable prototype with the Aam Digital design system |
| `figma-mockups`       | Design screens in the Aam Digital Figma design system file     |
| `plan-implementation` | Write the implementation plan for an issue                     |
| `review-pull-request` | Review a pull request                                          |

Set up once: open Claude Code in this repository and trust the folder, and log in to the GitHub CLI
(`gh auth login`). `design-prototype` needs the Artifact tool (log in with your Claude account) and view access
to the **Aam Digital** design system, `figma-mockups` the Figma connector. The skills write drafts and never
post to GitHub, you paste the result yourself.

## MCP Servers

MCP servers are configured in `.vscode/mcp.json`:

- **angular-cli** — Angular CLI operations, schematics, component generation
- **chrome-devtools** — Runtime debugging, DOM inspection, console access
- **sentry** — Production error data, issue investigation (requires `SENTRY_AUTH_TOKEN` env var)
- **github** — Issues, PRs, diffs, repository context (requires `GITHUB_PERSONAL_ACCESS_TOKEN` env var)

## Tips for Effective Prompting

- Be specific about the entity/component you're working with
- Reference existing patterns and similar implementations
- Let agents read relevant files first before making changes
- Use the agent files as starting points for common workflows

---

# Contribute

Our project is completely run by volunteers. Contributions welcome!

We are trying hard to make it easy for you to join in.
As a starting point, please refer to our **[CONTRIBUTING](./CONTRIBUTING.md)** page.
