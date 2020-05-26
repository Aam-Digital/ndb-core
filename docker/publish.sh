#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

TAG=$1

root=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )


cd $root/..
ng build --prod
cd $root
rm -r ./dist
cp -r ../dist ./dist
docker build -t ndb-server .
docker tag ndb-server aamdigital/ndb-server:$TAG
docker push aamdigital/ndb-server:$TAG
