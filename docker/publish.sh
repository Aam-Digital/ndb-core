#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker build -t ndb-server .
docker tag ndb-server aamdigital/ndb-server:$TRAVIS_TAG
docker push aamdigital/ndb-server
