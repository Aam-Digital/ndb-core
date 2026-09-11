FROM nginxinc/nginx-unprivileged:1.31.5-alpine AS app
COPY ./build/default.conf /etc/nginx/templates/default.conf

# Not under /etc/nginx/templates/: the base image auto-envsubsts every
# *.template file found there (using every env var, no allowlist) before our
# CMD runs - wrong destination, uncurated substitution. Handled explicitly in
# CMD instead.
COPY ./build/keycloak.json.template /etc/nginx/keycloak.json.template
COPY ./dist/ /usr/share/nginx/html

# assets/keycloak.json is generated at container start (see KEYCLOAK_URL
# below). COPY always writes as root regardless of USER, so briefly switch
# back to hand it to the unprivileged nginx user (101), then drop back down.
USER root
RUN chown 101:101 /usr/share/nginx/html/assets/keycloak.json
USER 101

# The port on which the app will run in the Docker container
ENV PORT=8080
# The url to the CouchDB database, or - in a deployment that puts something in
# front of it (e.g. replication-backend) - to that entrypoint instead. Target
# for the app's /db path.
#
# Must resolve without a DNS search list: nginx re-resolves this itself at
# request time via `resolver` (needed to preserve url-encoding in the request
# path - see default.conf), which unlike libc ignores /etc/resolv.conf's
# `search` domains. A bare Kubernetes service name (e.g. "couchdb") will
# therefore NXDOMAIN - use its fully-qualified name instead. A plain
# docker-compose service name works as-is (its embedded DNS resolves short
# names directly).
ENV COUCHDB_URL="http://localhost"
# The url straight to CouchDB, bypassing whatever COUCHDB_URL points at.
# Target for the app's /db/couchdb path, used for direct admin access. Same
# resolvability constraint as COUCHDB_URL above.
#
# Defaults to COUCHDB_URL, so /db and /db/couchdb both reach CouchDB directly.
ENV COUCHDB_DIRECT_URL=""

# The Keycloak realm and server url used to generate assets/keycloak.json at
# container start (see keycloak.json.template). Left unset by default: the
# app is shipped (see COPY ./dist/ above) with a static assets/keycloak.json
# already containing this repo's dummy dev values, so an unconfigured
# deployment needs no generation to behave as before. Generation only runs
# when both are set - which also keeps this backwards compatible with older
# deployments that instead bind-mount their own file over assets/keycloak.json:
# since neither var is set there, the mounted file is left untouched instead
# of failing to start over an EACCES (mounted files are often not writable by
# this image's unprivileged nginx user).
ENV KEYCLOAK_URL=""
ENV KEYCLOAK_REALM=""

# The url to the backend API, see https://github.com/Aam-Digital/aam-services
ENV API_URL="http://localhost:3000"

# The url to a nominatim instance, see https://nominatim.org/
ENV NOMINATIM_URL="https://nominatim.openstreetmap.org"

# content security policy headers
# (see ./README.md in this folder for what these do and how to change them)
ENV CSP_REPORT_URI="https://o167951.ingest.sentry.io/api/1242399/security/"
# overwrite the Content-Security-Policy rules (report-uri is added automatically)
# default includes all required whitelists for production server
# to disable any CSP blocking, set to "default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'"
ENV CSP="default-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob: https://*.tile.openstreetmap.org/ https://matomo.aam-digital.org https://fcmregistrations.googleapis.com/v1/projects/* https://www.gstatic.com/firebasejs/* https://*.aam-digital.com https://*.aam-digital.net https://*.aam-digital.app https://api.github.com/repos/Aam-Digital/ https://aam-digital.github.io https://sentry.io https://raw.githubusercontent.com $CSP_REPORT_URI; style-src 'self' 'unsafe-inline'"
# 'unsafe-eval' required for pouchdb https://github.com/pouchdb/pouchdb/issues/7853#issuecomment-535020600

# additional origins that are allowed to embed the app in an iframe (space-separated),
# e.g. "https://example.com https://www.example.com" to embed the app in another website.
# The app's own origin is always allowed; empty (default) means only that origin.
ENV CSP_EXTRA_FRAME_ANCESTORS=""

# variables are inserted into the nginx config
# RESOLVER is all IPv4 nameservers from /etc/resolv.conf, joined by spaces, used so nginx can
# re-resolve upstreams (CouchDB, Nominatim) at runtime with IPv6 disabled (see default.conf).
CMD export RESOLVER=$(awk '$1=="nameserver" && $2 !~ /:/ {print $2}' /etc/resolv.conf | xargs) &&\
    if [ -z "$RESOLVER" ]; then export RESOLVER=8.8.8.8; fi &&\
    export COUCHDB_DIRECT_URL="${COUCHDB_DIRECT_URL:-$COUCHDB_URL}" &&\
    if [ -n "$KEYCLOAK_URL" ] && [ -n "$KEYCLOAK_REALM" ]; then\
      envsubst '$$KEYCLOAK_URL $$KEYCLOAK_REALM' < /etc/nginx/keycloak.json.template > /usr/share/nginx/html/assets/keycloak.json ||\
        echo 'WARN: KEYCLOAK_URL/KEYCLOAK_REALM are set but assets/keycloak.json could not be written (e.g. still bind-mounted read-only by an older deployment config) - serving the existing file unchanged' >&2;\
    fi &&\
    envsubst '$$PORT $$COUCHDB_URL $$COUCHDB_DIRECT_URL $$API_URL $$NOMINATIM_URL $$RESOLVER $$CSP $$CSP_REPORT_URI $$CSP_EXTRA_FRAME_ANCESTORS' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf &&\
    exec nginx -g 'daemon off;'
