FROM nginxinc/nginx-unprivileged:alpine AS app
COPY ./build/default.conf /etc/nginx/templates/default.conf
COPY ./dist/ /usr/share/nginx/html

# The port on which the app will run in the Docker container
ENV PORT=8080
# The url to the CouchDB database
ENV COUCHDB_URL="http://localhost"
# The url to the query backend, see https://github.com/Aam-Digital/query-backend
ENV QUERY_URL="http://localhost:3000"
# The url to a nominatim instance, see https://nominatim.org/
ENV NOMINATIM_URL="https://nominatim.openstreetmap.org"

# content security policy headers
# (also see Developer Documentation: https://aam-digital.github.io/ndb-core/documentation/additional-documentation/concepts/security.html)
ENV CSP_REPORT_URI="https://o167951.ingest.sentry.io/api/1242399/security/"
# overwrite the Content-Security-Policy rules (report-uri is added automatically)
# default includes all required whitelists for production server
# to disable any CSP blocking, set to "default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'"
ENV CSP="default-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob: https://*.tile.openstreetmap.org/ https://matomo.aam-digital.org https://fcmregistrations.googleapis.com/v1/projects/* https://www.gstatic.com/firebasejs/* https://*.aam-digital.com https://*.aam-digital.net https://*.aam-digital.app https://api.github.com/repos/Aam-Digital/ https://sentry.io $CSP_REPORT_URI; style-src 'self' 'unsafe-inline'"
# 'unsafe-eval' required for pouchdb https://github.com/pouchdb/pouchdb/issues/7853#issuecomment-535020600

# variables are inserted into the nginx config
CMD envsubst '$$PORT $$COUCHDB_URL $$QUERY_URL $$NOMINATIM_URL $$CSP $$CSP_REPORT_URI' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf &&\
    nginx -g 'daemon off;'
