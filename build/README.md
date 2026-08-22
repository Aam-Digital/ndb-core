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

| Variable                    | Default                                | Purpose                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`                      | `8080`                                 | Port nginx listens on inside the container.                                                                                                                                                                                                                                                                                    |
| `COUCHDB_URL`               | `http://localhost`                     | Proxy target for the app's `/db` path.                                                                                                                                                                                                                                                                                         |
| `QUERY_URL`                 | `http://localhost:3000`                | Proxy target for the app's `/api` path (and the deprecated `/query` alias).                                                                                                                                                                                                                                                    |
| `NOMINATIM_URL`             | `https://nominatim.openstreetmap.org`  | Proxy target for the app's `/nominatim` path, used for geocoding.                                                                                                                                                                                                                                                              |
| `CSP`                       | see `Dockerfile`                       | Overwrites the report-only `Content-Security-Policy-Report-Only` directives; `report-uri ${CSP_REPORT_URI}` is appended automatically. The default already allowlists everything the app needs in production — only override it if a deployment needs additional sources.                                                      |
| `CSP_REPORT_URI`            | aam-digital's Sentry security endpoint | Where violation reports for the report-only policy above are sent.                                                                                                                                                                                                                                                             |
| `CSP_EXTRA_FRAME_ANCESTORS` | empty                                  | Other origins (space-separated, e.g. `"https://example.com https://www.example.com"`) allowed to embed the app in an iframe, added to the enforcing `Content-Security-Policy: frame-ancestors` header. The app's own origin is always allowed; leaving this empty is equivalent to the previous `X-Frame-Options: SAMEORIGIN`. |

See also the [security
documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/concepts/security.html)
for more on the app's CSP approach.

## How does the release process work?

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automatically create new versions.

1. Commits on the `master` branch are analyzed and a pre-release version is automatically tagged.
2. To create a stable release, a core team member manually triggers the release GitHub Action (`create-release.yml` workflow dispatch). This creates a regular (non-prerelease) version from `master`.
