# This docker image can be used to run the application locally.
# To use it only Docker needs to be installed locally.

# Run the following commands from the ndb-core root folder:
## Run tests:
# >> docker build --target test -f build/Dockerfile -t aam-digital .

## Build the application:
# >> docker build --target dist-build -f build/Dockerfile -o . -t aam-digital .

## Build and start application container:
# >> docker build --target app -f build/Dockerfile -t aam-digital .
# >> docker run -p=80:80 aam-digital

# DIST_TYPE
#   --build-arg DIST_TYPE=build
# -> build (default): will build the application
# -> local: will use existing $LOCAL_DIST_PATH (default ./dist/) folder from file system
# Will be used for packaging the application into a web container.
# Just relevant for the stage "app"
ARG DIST_TYPE="build"

FROM node:lts-slim AS base
COPY package.json ./opt/app/package.json
COPY package-lock.json ./opt/app/package-lock.json


FROM base AS base-with-dependencies
WORKDIR /opt/app
RUN npm ci --no-progress


FROM debian:bookworm-slim AS base-with-dependencies-and-testsuite
COPY --from=base-with-dependencies /opt/app /opt/app

RUN apt-get update && apt-get install -y curl
WORKDIR /tmp
# 121.0.6167.139-1~deb12u1 -> 2024-02-01
ARG CHROMIUM_VERSION=121.0.6167.139-1~deb12u1
RUN curl -o chromium-common.deb https://ftp.debian.org/debian/pool/main/c/chromium/chromium-common_${CHROMIUM_VERSION}_$(dpkg --print-architecture).deb
RUN curl -o chromium.deb https://ftp.debian.org/debian/pool/main/c/chromium/chromium_${CHROMIUM_VERSION}_$(dpkg --print-architecture).deb
RUN apt-get install -y ./chromium-common.deb ./chromium.deb build-essential git libssl-dev

SHELL ["/bin/bash", "--login", "-c"]
RUN curl -o- install_nvm.sh https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
RUN nvm install 20

WORKDIR /opt/app
RUN curl -o cc-test-reporter https://codeclimate.com/downloads/test-reporter/test-reporter-0.11.1-linux-$(dpkg --print-architecture) && \
    chmod +x ./cc-test-reporter


FROM base-with-dependencies-and-testsuite AS test
WORKDIR /opt/app
COPY ./src /opt/app/src/
COPY ./e2e /opt/app/e2e/
COPY ./build /opt/app/build/
COPY ./.browserslistrc /opt/app/
COPY ./.codeclimate.yml /opt/app/
COPY ./.eslintrc.json /opt/app/
COPY ./.prettierignore /opt/app/
COPY ./.prettierrc.json /opt/app/
COPY ./angular.json /opt/app/
COPY ./cypress.config.ts /opt/app/
COPY ./karma.conf.js /opt/app/
COPY ./tsconfig.app.json /opt/app/
COPY ./tsconfig.spec.json /opt/app/
COPY ./tsconfig.json /opt/app/
COPY ./ngsw-config.json /opt/app/

ARG TZ
RUN if [ -n "${TZ}" ] ; then \
    apt-get install -y tzdata && \
    cp /usr/share/zoneinfo/Europe/Brussels /etc/localtime && \
    echo "$TZ" > /etc/timezone ; fi

RUN npm run lint
ARG CHROME_BIN=/usr/lib/chromium/chromium
RUN npm run test-ci


FROM scratch AS test-coverage
COPY --from=test /opt/app/coverage/ ./coverage/


FROM base-with-dependencies AS build
WORKDIR /opt/app
COPY ./src /opt/app/src/
COPY ./build /opt/app/build/
COPY ./angular.json /opt/app/
COPY ./tsconfig.json /opt/app/
COPY ./tsconfig.app.json /opt/app/
COPY ./tsconfig.spec.json /opt/app/
COPY ./ngsw-config.json /opt/app/

ARG APP_VERSION="UNKNOWN"
RUN sed -i "s/appVersion: \".*\"/appVersion: \"$APP_VERSION\"/g" src/environments/environment*.ts

RUN node build/prepare-translation-files.js
RUN npm run build

RUN if [ "$INJECT_DEBUG_INFORMATION" = true ] ; then \
    npm install -g @sentry/cli && \
    sentry-cli sourcemaps inject ./dist ; fi


FROM scratch AS dist-build
COPY --from=build /opt/app/dist/ ./dist/


FROM scratch AS dist-local
ARG LOCAL_DIST_PATH=./dist/
COPY $LOCAL_DIST_PATH ./dist/


FROM dist-${DIST_TYPE} AS dist


### PROD image
FROM nginxinc/nginx-unprivileged:alpine AS app
COPY ./build/default.conf /etc/nginx/templates/default.conf

COPY --from=dist /dist/ /usr/share/nginx/html

# The port on which the app will run in the Docker container
ENV PORT=80
# The url to the CouchDB database
ENV COUCHDB_URL="http://localhost"
# The url to the query backend, see https://github.com/Aam-Digital/query-backend
ENV QUERY_URL="http://localhost:3000"
# The url to a nominatim instance, see https://nominatim.org/
ENV NOMINATIM_URL="https://nominatim.openstreetmap.org"

# content security policy headers
# (also see Developer Documentation: https://aam-digital.github.io/ndb-core/documentation/additional-documentation/concepts/security.html)
ENV CSP_REPORT_URI="https://o167951.ingest.sentry.io/api/1242399/security/"
# overwrite the Content-Security-Policy rules (report-uri is added automatically)
# default includes all required whitelists for production server
# to disable any CSP blocking, set to "default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'"
ENV CSP="default-src 'self' 'unsafe-eval' data: blob: https://*.tile.openstreetmap.org/ https://matomo.aam-digital.org  https://*.aam-digital.com https://api.github.com/repos/Aam-Digital/ https://sentry.io $CSP_REPORT_URI; style-src 'self' 'unsafe-inline'"
# 'unsafe-eval' required for pouchdb https://github.com/pouchdb/pouchdb/issues/7853#issuecomment-535020600

# variables are inserted into the nginx config
RUN envsubst '$$PORT $$COUCHDB_URL $$QUERY_URL $$NOMINATIM_URL $$CSP $$CSP_REPORT_URI' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
