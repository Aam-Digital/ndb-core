# This docker image can be used to run the application locally.
# To use it only Docker needs to be installed locally
# Run the following commands from the root folder to build, run and kill the application
# >> docker build -f docker/pipeline/Dockerfile -t aam/digital:latest .
# >> docker run -p=80:80 -t aam/digital:latest aam-digital
# >> docker kill aam-digital
FROM node:15.1.0-alpine3.12 as builder
WORKDIR /app

# Set this to true to run tests and upload the coverage report. When set, the following args need to be provided
ARG PIPELINE_RUN=false

# These variables need to be provided in the build step of docker when PIPELINE_RUN is set to true
# >> docker build --build-arg PIPELINE_RUN=true --build-arg GIT_COMMIT_SHA=<COMMIT_SHA> ...
ARG GIT_COMMIT_SHA
ARG GIT_BRANCH
ARG GIT_COMMITTED_AT
ARG CC_TEST_REPORTER_ID

COPY package*.json ./
RUN npm ci --no-progress

# In the pipeline we need to install and set additional dependencies for testing and reporting
RUN if [ "$PIPELINE_RUN" = true ] ; then \
    apk --no-cache add curl chromium git &&\
    CHROME_BIN=/usr/bin/chromium-browser &&\
    curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter &&\
    chmod +x ./cc-test-reporter &&\
    ./cc-test-reporter before-build ; fi

COPY patch-webpack.js .
# postinstall executes ngcc and runs the webpack-patch
RUN npm run postinstall
RUN $(npm bin)/ng version
COPY . .

# In the pipeline we run the tests and report the results
RUN if [ "$PIPELINE_RUN" = true ] ; then \
    npm run lint &&\
    npm run test-ci &&\
    ./cc-test-reporter after-build --debug ; fi

RUN $(npm bin)/ng build --prod

### PROD image

FROM nginx:1.19.4-alpine
ENV PORT=80
COPY ./docker/pipeline/deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
CMD sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
