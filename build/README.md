# Aam Digital Build Process

The Angular app is build within a custom docker container to ensure it is reproducible and optimized with caching.

Builds are triggered through GitHub Actions CI (see /.github/workflows).

The deployable server (nginx) image is published to [Docker Hub](https://hub.docker.com/r/aamdigital/ndb-server)
for every official (tagged) build.

## How to build & publish a new image

You can simply create a new git tag and the CI setup will build and publish a docker image for that version.

## Building locally

Run the following commands from the root folder to build, run and kill the application on your local machine:

```
docker build -f build/Dockerfile -t aam/digital:latest .
docker run -p=80:80 --name aam-digital aam/digital:latest
docker stop aam-digital
```

## Configuration

The image is configured through environment variables, declared with their
defaults as `ENV` values in [`Dockerfile`](./Dockerfile) and substituted into
the nginx config at container start (see [`default.conf`](./default.conf)).
Override any of them (e.g. via `docker run -e`, a `docker-compose.yml`
`environment:` block, or a Helm chart's pod spec) to change that behavior;
anything left unset keeps the default below.

| Variable                                             | Default                               | Purpose                                                                                                    |
| ---------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `PORT`                                               | `8080`                                | Port nginx listens on inside the container.                                                                |
| `COUCHDB_URL`                                        | `http://localhost`                    | Proxy target for the app's `/db` path.                                                                     |
| `QUERY_URL`                                          | `http://localhost:3000`               | Proxy target for the app's `/api` path (and the deprecated `/query` alias).                                |
| `NOMINATIM_URL`                                      | `https://nominatim.openstreetmap.org` | Proxy target for the app's `/nominatim` path, used for geocoding.                                          |
| `CSP`, `CSP_REPORT_URI`, `CSP_EXTRA_FRAME_ANCESTORS` | see below                             | Content Security Policy headers — see [Content Security Policy (CSP)](#content-security-policy-csp) below. |

## How does the release process work?

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automatically create new versions.

1. Commits on the `master` branch are analyzed and a pre-release version is automatically tagged.
2. To create a stable release, a core team member manually triggers the release GitHub Action (`create-release.yml` workflow dispatch). This creates a regular (non-prerelease) version from `master`.

## Content Security Policy (CSP)

The nginx server built here sets the security headers of the served app.
Two CSP headers are set in [`default.conf`](./default.conf), with their values coming from docker environment variables defined in the [`Dockerfile`](./Dockerfile).

For the wider picture of what these headers do and do not protect against, see the [Security concept](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/concepts/security.html).

### Whitelisting sources (`CSP`)

Which sources the app may load code, styles and data from is whitelisted through the `CSP` environment variable.
The default whitelist covers everything a production server needs and is defined in the [`Dockerfile`](./Dockerfile).

> This policy is currently sent as `Content-Security-Policy-Report-Only` for testing.
> Violations are reported to `CSP_REPORT_URI` (defaulting to aam-digital's Sentry security endpoint) but scripts and connections are not yet blocked.

To disable any CSP blocking entirely, set
`CSP="default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'"`.

#### Allowing PouchDB to function under CSP

The browser-side database system PouchDB uses map-reduce functions for indexing which are defined as strings.
It therefore requires `'unsafe-eval'` in the CSP.

#### Whitelisting the index.html

To whitelist a specific script section (currently only in the index.html) a [CSP hash](https://content-security-policy.com/hash/) can be used.
Updating the hash should be necessary only rarely, when that script section changes.

The easiest and most reliable way to get the correct hash is to deploy a production build image and check the browser console.
It states something like `"Refused to execute inline script because it violates the following Content Security Policy directive: "...". Either the 'unsafe-inline' keyword, a hash ('sha256-<RELEVANT HASH>')" or a nonce is required."` from where you can copy the given hash and include/update it in the CSP headers.
Generating the hash by pasting the script into an online generator does not seem to work, probably because code is minified during the build process.

### Embedding the app in an iframe (`CSP_EXTRA_FRAME_ANCESTORS`)

Which sites are allowed to embed the app in an iframe is controlled by a second, _enforcing_ CSP header: `Content-Security-Policy: frame-ancestors 'self' ...`.
This has to be a separate header because `frame-ancestors` is ignored in a "report-only" policy.
As that policy contains no other directive, it does not restrict anything but framing and the whitelist above stays report-only.

By default only the app's own origin can embed it.
To let other sites embed an instance (e.g. a demo system embedded into a project website), set the docker environment variable `CSP_EXTRA_FRAME_ANCESTORS` to a space-separated list of origins, e.g. `https://example.com https://www.example.com`.
Each origin has to be given with its scheme and exact host - `example.com` and `www.example.com` are different origins - and without any path.

### Other security headers

`X-Content-Type-Options: nosniff` is set unconditionally and is not configurable.
