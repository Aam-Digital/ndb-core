FROM node:15.1.0-alpine3.12 as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-progress
RUN curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
RUN chmod +x ./cc-test-reporter
RUN ./cc-test-reporter before-build
RUN ng lint
RUN ng test --watch=false --code-coverage
RUN ./cc-test-reporter after-build --debug
COPY patch-webpack.js .
# postinstall executes ngcc and runs the webpack-patch
RUN npm run postinstall
RUN $(npm bin)/ng version
COPY . .
RUN $(npm bin)/ng build --prod

### PROD image

FROM nginx:1.19.4-alpine
COPY ./deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html
CMD sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
