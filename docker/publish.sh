#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

TAG=$1

root=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

rm -r $root/dist
cp -r $root/../dist $root/dist
docker build -t ndb-server $root
docker tag ndb-server aamdigital/ndb-server:$TAG
docker push aamdigital/ndb-server:$TAG
