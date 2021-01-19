# This docker image can be used to run the application locally.
# To use it only Docker needs to be installed locally
# Run the following commands from the root folder to build, run and kill the application
# >> docker build -f build/Dockerfile -t aam/digital:latest .
# >> docker run -p=80:80 aam/digital:latest aam-digital
# >> docker kill aam-digital
FROM node:15.1.0-alpine3.12 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-progress

COPY patch-webpack.js .
# postinstall executes ngcc and runs the webpack-patch
RUN npm run postinstall
RUN $(npm bin)/ng version

COPY pipeline .
RUN $(npm bin)/ng build --prod

# When set to true, chromium is installed an tests are executed
ARG RUN_TESTS=false
ARG CHROME_BIN=/usr/bin/chromium-browser
# In the pipeline we run the tests and report the results
RUN if [ "$RUN_TESTS" = true ] ; then \
    apk --no-cache add chromium &&\
    npm run lint &&\
    npm run test-ci ; fi


### PROD image

FROM nginx:1.19.4-alpine
COPY ./build/default.conf /etc/nginx/templates/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
ENV PORT=80
ENV WEBDAV_URL="http://localhost"
ENV COUCHDB_URL="http://localhost"
# variables are inserted into the nginx config
CMD envsubst '$$PORT $$WEBDAV_URL $$COUCHDB_URL' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf &&\
    nginx -g 'daemon off;'
