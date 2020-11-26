FROM node:15.1.0-alpine3.12 as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-progress
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
CMD ["nginx", "-g", "daemon off;"]
