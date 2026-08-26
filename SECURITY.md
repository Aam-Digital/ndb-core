# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report them privately through GitHub's
[Report a vulnerability](https://github.com/Aam-Digital/ndb-core/security/advisories/new)
form, or by email to [it@aam-digital.com](mailto:it@aam-digital.com)
with "security" in the subject line.

Helpful to include, as far as you have it:

- what the issue is and which part of the app it affects
- steps to reproduce it, or a proof of concept
- what an attacker could achieve with it
- the version you tested against

We will acknowledge your report within five working days and keep you updated
while we work on it. Please give us reasonable time to release a fix before
disclosing the issue publicly. We are happy to credit you in the advisory
unless you would rather stay anonymous.

Aam Digital is used by social-sector organisations to hold personal data about
vulnerable people. Reports are taken seriously, and we would rather hear about a
suspected problem that turns out to be harmless than not hear about a real one.

## Supported versions

Fixes are released from the `master` branch and published as a new version. Only
the most recent release is supported - if you run an older one, updating is the
first step.

## Scope

This policy covers the Aam Digital application in this repository and the nginx
image built from it.

Out of scope, because they are not this code base:

- the servers and databases an instance runs on, including their operating
  system, network configuration, encryption at rest and backups
- the Keycloak server used for authentication, and how it is configured
- deployments run by clients or partners, and the configuration choices made in
  them

The developer documentation's
[Security concept](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/concepts/security.html)
describes what the application protects and what it deliberately leaves to
whoever operates the servers.

If you have found a problem in a **hosted (SaaS) Aam Digital system** we
operate, report it the same way - say which instance it concerns, and please do
not access, modify or download any data that is not your own while
investigating.
