# Aam Digital Build Process

The Angular app is build within a custom docker container to ensure it is reproducible and optimized with caching.

Builds are triggered through GitHub Actions CI (see /.github/workflows).

The deployable server (nginx) image is published to [Docker Hub](https://hub.docker.com/r/aamdigital/ndb-server)
for every official (tagged) build.
