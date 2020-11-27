FROM node:15.1.0-alpine3.12 as builder
WORKDIR /app
ARG GIT_COMMIT_SHA
ARG GIT_BRANCH
RUN echo $GIT_BRANCH
COPY package*.json ./
RUN npm ci --no-progress
RUN apk --no-cache add curl chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
RUN curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
RUN chmod +x ./cc-test-reporter
RUN ./cc-test-reporter before-build
COPY patch-webpack.js .
# postinstall executes ngcc and runs the webpack-patch
RUN npm run postinstall
RUN $(npm bin)/ng version
COPY . .
RUN npm run lint
RUN npm run test-ci
RUN ./cc-test-reporter after-build --debug
RUN $(npm bin)/ng build --prod

### PROD image

FROM nginx:1.19.4-alpine
COPY ./deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
CMD sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
