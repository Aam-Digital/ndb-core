FROM node:15.1.0-alpine3.12 as builder
WORKDIR /app

# Set this to true to run tests and upload the coverage report. When set, the following args need to be provided
ARG PIPELINE_RUN=false

# These are need to use the test reporter for code climate
ARG GIT_COMMIT_SHA
ARG GIT_BRANCH
ARG GIT_COMMITTED_AT
ARG CC_TEST_REPORTER_ID

COPY package*.json ./
RUN npm ci --no-progress

# In the pipeline we need to install additional and set additional dependencies for testing and reporting
RUN if [ "$PIPELINE_RUN" = true ] ; then \
    apk --no-cache add curl chromium git &&\
    curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter &&\
    chmod +x ./cc-test-reporter &&\
    ./cc-test-reporter before-build &&\
    CHROME_BIN=/usr/bin/chromium-browser ; fi

COPY patch-webpack.js .
# postinstall executes ngcc and runs the webpack-patch
RUN npm run postinstall
RUN $(npm bin)/ng version
COPY . .

# In the pipeline we run the tests  and report the results
RUN if [ "$PIPELINE_RUN" = true ] ; then \
    npm run lint &&\
    npm run test-ci &&\
    ./cc-test-reporter after-build --debug ; fi

RUN $(npm bin)/ng build --prod

### PROD image

FROM nginx:1.19.4-alpine
ENV PORT=80
COPY ./deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
CMD sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
