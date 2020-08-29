FROM nginx

# .template will automatically have environment variables injected during container startup
COPY nginx_default.conf.template /etc/nginx/templates/default.conf.template

WORKDIR /usr/share/nginx/html

COPY ./dist/ ./
