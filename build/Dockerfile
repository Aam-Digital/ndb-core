# This docker image can be used to run the application locally.
# To use it only Docker needs to be installed locally
# Run the following commands from the root folder to build, run and kill the application
# >> docker build -f build/Dockerfile -t aam-digital .
# >> docker run -p=80:80 aam-digital
FROM node:16.14.2-alpine3.15 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-progress

RUN $(npm bin)/ng version

COPY . .

ARG APP_VERSION="UNKNOWN"
RUN sed -i "s/appVersion: \".*\"/appVersion: \"$APP_VERSION\"/g" src/environments/environment*.ts


# When set to false, no production build for the app is done
ARG BUILD=true
RUN if [ "$BUILD" = true ] ; then \
    node build/prepare-translation-files.js &&\
    npm run build ; fi


# When set to true, tests are run and coverage will be uploaded to CodeClimate
ARG UPLOAD_COVERAGE=false
RUN if [ "$UPLOAD_COVERAGE" = true ] ; then \
    apk --no-cache add curl &&\
    curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter &&\
    chmod +x ./cc-test-reporter &&\
    ./cc-test-reporter before-build ; fi

# When set to true, chromium is installed an tests are executed
ARG RUN_TESTS=false
ARG CHROME_BIN=/usr/bin/chromium-browser
# Install chromium for karma, lint code and run tests
RUN if [ "$RUN_TESTS" = true ] || [ "$UPLOAD_COVERAGE" = true ] ; then \
    apk --no-cache add chromium &&\
    npm run lint &&\
    npm run test-ci ; fi

# The following arguments need to be provided for the code climate test reporter to work correctly
# The commit sha
ARG GIT_COMMIT_SHA
# The branch
ARG GIT_BRANCH
# The time of the commit, can be extracted with `git log -1 --pretty=format:%ct`
ARG GIT_COMMITTED_AT
# The ID for the test reporter, can be found on CodeCoverage
ARG CC_TEST_REPORTER_ID
RUN if [ "$UPLOAD_COVERAGE" = true ] ; then ./cc-test-reporter after-build --debug ; fi

# Information required to upload the sourcemap to sentry
# If not set, nothing is uploaded
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
RUN if [ "$SENTRY_AUTH_TOKEN" != "" ] ; then \
    npm install -g @sentry/cli &&\
    sentry-cli --auth-token=$SENTRY_AUTH_TOKEN releases --org=$SENTRY_ORG --project=$SENTRY_PROJECT files ndb-core@$APP_VERSION upload-sourcemaps dist  && \
    rm dist/*.map ; fi

### PROD image

FROM nginx:1.25.1-alpine
COPY ./build/default.conf /etc/nginx/templates/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
# The port on which the app will run in the Docker container
ENV PORT=80
# The url to the CouchDB database
ENV COUCHDB_URL="http://localhost"
# The url to a nominatim instance, see https://nominatim.org/
ENV NOMINATIM_URL="https://nominatim.openstreetmap.org"

# content security policy headers
ENV CSP_REPORT_URI=""
# overwrite the Content-Security-Policy rules (report-uri is added automatically)
## default includes all required whitelists for production server
## to disable any CSP blocking, set to "default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'"
ENV CSP="default-src 'self' 'unsafe-eval' data: https://*.tile.openstreetmap.org/ https://matomo.aam-digital.org  https://*.aam-digital.com https://api.github.com/repos/Aam-Digital/ https://sentry.io https://o167951.ingest.sentry.io/api/1242399/security/ 'sha256-Sh1PNRUktjifFwuOicavxmlAcFpZMbUqQGiCIoKhDI8='; style-src 'self' 'unsafe-inline'"
### 'sha256-Sh1PNRUktjifFwuOicavxmlAcFpZMbUqQGiCIoKhDI8=' for index.html writing browser details
### 'unsafe-eval' required for pouchdb https://github.com/pouchdb/pouchdb/issues/7853#issuecomment-535020600
### https://o167951.ingest.sentry.io/api/1242399/security/ to allow reporting of CSP violations to the Aam Digital standard sentry.io endpoint

# variables are inserted into the nginx config
CMD envsubst '$$PORT $$COUCHDB_URL $$NOMINATIM_URL $$CSP $$CSP_REPORT_URI' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf &&\
    nginx -g 'daemon off;'
