#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

root=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
echo $root

cp -r $root/../dist $root/dist
docker build -t ndb-server $root
docker tag ndb-server aamdigital/ndb-server:$TRAVIS_TAG
docker push aamdigital/ndb-server
