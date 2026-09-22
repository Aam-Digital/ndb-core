# Security

A conceptual overview of how a single Aam Digital system protects the data it holds:
what the application does, what it leaves to the deployment, and what it does not do at all.

This is about **one deployed system** (the app, its database and the accounts that reach it).

> **Server operation and infrastructure are out of scope here.**
> See the last section, "What this document does not cover".

## The application in the browser

Aam Digital is an Angular single-page application. Everything a user sees is rendered in the browser from data fetched from the database.

**Cross-site scripting.** Angular treats all values as untrusted by default and escapes or sanitizes them for the context they are rendered into, which covers the ordinary case of a record field containing markup (see [Angular > Security](https://angular.dev/best-practices/security)).
Sanitization is only bypassed deliberately and under code review, never for values that originate from user-entered record content.

**Content Security Policy and framing.** The nginx server that serves the built app sets two policy headers: a whitelist of the sources the app may load code and data from, and an enforcing policy for which sites may embed the app in an iframe.
Both are configurable per deployment.

> The whitelist policy is currently served in **report-only** mode: violations are reported, not blocked.
> Only the framing policy is enforced.

The directives, their defaults and how to change them are documented with the image that sets them, under [Content Security Policy in `build/README.md`](https://github.com/Aam-Digital/ndb-core/blob/master/build/README.md#content-security-policy-csp).

**Offline shell.** The app is installable and keeps working offline, which means an outdated version can keep running on a device until it next connects. Fixes reach users on their next online session, not immediately.

## Authentication

Users authenticate against a **Keycloak** server (OpenID Connect). Aam Digital never sees or stores a password: the app receives a token and passes it on to the database.
Password policy, multi-factor authentication, session lifetime, account lockout and email verification are therefore Keycloak configuration, not application code.

Each system has its own Keycloak realm, and **membership of that realm is what grants access to that system's data**. In a database-only deployment, removing a person's access means disabling or removing their account in Keycloak — changing their roles inside the application is not sufficient on its own; see "Database-only, and what it does not give you" below.

Once a user has logged in online at least once, the app offers them an **offline login** on the same device. This is a profile selection, not an authentication step: no credential is checked, because none is stored and the authentication server cannot be reached. It opens the local copy of the data that is already on that device, and grants nothing beyond it — but it does mean that whoever holds the device can open that copy. See "The copy of data on each user's device" below.

## Roles and permissions

Permissions are role-based rules in a single configuration document that an administrator edits. The rule format, the available conditions and how rules combine are documented under [User Roles and Permissions](./user-roles-and-permissions.html).

Where those rules are actually _enforced_ depends on how the system is deployed, and that difference is a security property rather than a detail.

### Two deployment modes

|                    | **Database-only**                       | **With permission backend**                                                                               |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| What is exposed    | CouchDB directly                        | [replication-backend](https://github.com/Aam-Digital/replication-backend) in front of an internal CouchDB |
| Who checks a token | CouchDB, against the realm's public key | the backend, against the realm's public key                                                               |
| Read access        | the whole database of that system       | filtered per user, rule by rule                                                                           |
| Write access       | any document                            | validated against the same rules                                                                          |
| Audit log          | none                                    | optional (`AUDIT_ENABLED`): every write recorded with user and time                                       |

#### Database-only (no user roles)

This light-weight deployment does explicitly not support user roles and individual permissions.
All users with a valid login have full read/write access to all data.

Access to the database without a valid user account is not possible.
This also means _**Public Forms**_ cannot work for external data collection.

> Adding a `Config:Permissions` doc (in preparation of introducing user roles) is technically still possible.
> Those permissions are partly enforced by the local device's user interface
> but this **does not** enforce actual data protection on the server.
> DO NOT USE this as a security functionality.

Because CouchDB checks only realm membership and nothing about a user's role, narrowing someone's role never restricts what their existing token can fetch — withdrawing access means disabling their account in Keycloak, not just changing their role.

This mode is therefore appropriate when everyone with an account in the system is trusted with all of its data — a small team working on one caseload — and not when the roles are meant to keep colleagues apart.

#### With permission backend

Permissions of user roles are enforced server-side (in addition to local UI checks on the device):
reads are filtered while data is synced or requested from the server,
and writes are checked again before they are stored, with the database itself no longer reachable from outside.
Unlike database-only mode, a narrowed role then restricts what the user can actually fetch, not only what the interface offers.

The permission backend also includes functionality to record a detailed change history of who changed what.

**So if different users of one system must not see each other's data, the permission backend is required.**
Deploying either mode is described in [Aam-Digital/ndb-setup](https://github.com/Aam-Digital/ndb-setup#docker-compose-profiles).

## The copy of data on each user's device

To work offline, the app stores a copy of the records a user may access in the browser's storage on that user's device. This is what makes Aam Digital usable without connectivity, and it has consequences worth stating plainly:

- The copy includes whatever that user is allowed to sync.
- Revoking permissions server-side does not reach a device that never connects again. Local data is cleared when the server reports lost permissions during a sync, and that requires the device to come online.

Two settings bear on this:

- `session_type: online` runs without any local database at all. Data is read directly from the server and nothing persists on the device — at the cost of offline capability.
- `session_type_choice` decides whether users may choose between the two modes on the login page, or whether the configured mode is enforced.

Because the device is beyond anything the application can enforce, client organisations should be advised to keep devices locked and encrypted, to avoid sharing browser profiles between staff, and to report lost devices and staff departures promptly so that accounts can be disabled.

## Data in transit

All traffic between browser, application server, database and Keycloak is expected to be TLS-encrypted. Certificates and TLS termination are part of the deployment, not of this code base.

> **Side note — anonymization and deletion.** How long data is kept is a
> security question as much as a policy one: records that are no longer needed
> are still exposed by everything above. Aam Digital can archive, anonymize or
> delete an entity, with anonymization removing the personal fields while
> keeping the record countable for statistics. What each action does, and how a
> field is configured to survive anonymization, is documented under
> [Archiving, Anonymizing and Deleting Entities](https://github.com/Aam-Digital/ndb-core/blob/master/src/app/core/entity/entity-actions/README.md).

## Keeping the code base secure

- Dependencies are updated continuously through automated pull requests and scanned for known vulnerabilities on every push to `master` and weekly (Snyk, reported into GitHub code scanning).
- Changes are reviewed before merging; see [Review a Pull Request](../how-to-guides/review-a-pull-request.html).
- Aam Digital is open source, so the code implementing everything described here can be inspected rather than taken on trust.

## What this document does not cover

Everything below is **out of scope for the application** and belongs to whoever operates the servers:

- **Server and network security** — hardening, patching, firewalls, isolation between services, intrusion detection, log retention.
- **Encryption at rest** — disk and volume encryption for the database, uploaded files and any derived copies.
- **Backups** — that they run, that they are encrypted, that a restore has actually been tested, and who holds the keys.
- **Operating the Keycloak server** — its own hardening, backups and administrative access, along with the password and MFA policy configured in it.
- **Administrative access to the servers**, and the fact that whoever holds it can read the data of every system running on them.

Aam Digital is built so that these can be done well, but it cannot do them for you.
If you host the system yourself, treat them as real work: involve your IT department, or bring in an IT service provider, and hold them to the same standard as the application itself.

For most organisations the easier, more reliable and more secure option is a **hosted (SaaS) Aam Digital system**, where these responsibilities sit with a provider who maintains them as a matter of routine rather than as an occasional project.
