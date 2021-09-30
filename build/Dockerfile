# This docker image can be used to run the application locally.
# To use it only Docker needs to be installed locally
# Run the following commands from the root folder to build, run and kill the application
# >> docker build -f build/Dockerfile -t aam/digital:latest .
# >> docker run -p=80:80 aam/digital:latest:
# >> docker kill aam-digital

FROM nginx:1.21-alpine
COPY ./build/default.conf /etc/nginx/templates/default.conf
COPY dist/ /usr/share/nginx/html
# The port on which the app will run in the Docker container
ENV PORT=80
# The url to the webdav server
ENV WEBDAV_URL="http://localhost"
# The url to the CouchDB database
ENV COUCHDB_URL="http://localhost"
# The language which should be loaded on default options are "en-US" and "de"
ENV DEFAULT_LANGUAGE="en-US"
# variables are inserted into the nginx config
CMD envsubst '$$PORT $$WEBDAV_URL $$COUCHDB_URL $$DEFAULT_LANGUAGE' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf &&\
    nginx -g 'daemon off;'
