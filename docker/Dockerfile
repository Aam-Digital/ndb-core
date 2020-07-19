FROM nginx
COPY nginx_default.conf /etc/nginx/conf.d/default.conf
RUN mkdir /etc/nginx/conf.d/custom_config

WORKDIR /usr/share/nginx/html

COPY ./dist/ ./
