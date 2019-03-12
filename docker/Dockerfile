FROM nginx
COPY nginx_default.conf /etc/nginx/conf.d/default.conf

ENV VIRTUAL_HOST=localhost
VOLUME /usr/share/nginx/html/assets

WORKDIR /usr/share/nginx/html

COPY ./dist/ ./
COPY ./dist/assets/ ./assets.original/

# Create custom config.json file
WORKDIR /usr/share/nginx/html/assets.original
COPY ./dist/assets/config.default.json config.json
RUN sed -i -r "s/\"remote_url\": \"(.*)\"/\"remote_url\": \"https:\/\/:${VIRTUAL_HOST}\/db\/\"/" config.json
RUN sed -i -r "s/\"name\": \"(.*)\"/\"name\": \"app\"/" config.json
