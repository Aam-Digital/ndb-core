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

## How does the official release process work?

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automatically create new versions.
Our process roughly follows the [GitFlow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) process,
where our development branch is `master` and our "main" branch holding stable releases is `official-release`.

1. Commits on the `master` branch are analyzed and a pre-release version is automatically tagged.
2. To create an "official" release, merge the `master` into the `official-release` branch. This will trigger a regular new version.
