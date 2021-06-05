# This docker image can be used to run the application locally.
# To use it only Docker needs to be installed locally
# Run the following commands from the root folder to build, run and kill the application
# >> docker build -f build/Dockerfile -t aam/digital:latest .
# >> docker run -p=80:80 aam/digital:latest aam-digital
# >> docker kill aam-digital
FROM node:15.11.0-alpine3.13 as builder
WORKDIR /app

COPY package*.json ./
COPY patch-webpack.js .
RUN npm ci --no-progress

RUN $(npm bin)/ng version

COPY . .
RUN npm run build

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


### PROD image

FROM nginx:1.21-alpine
COPY ./build/default.conf /etc/nginx/templates/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
ENV PORT=80
ENV WEBDAV_URL="http://localhost"
ENV COUCHDB_URL="http://localhost"
# variables are inserted into the nginx config
CMD envsubst '$$PORT $$WEBDAV_URL $$COUCHDB_URL' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf &&\
    nginx -g 'daemon off;'
