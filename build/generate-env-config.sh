#!/bin/sh
# Writes the app settings given as environment variables of the container into
# the app's assets/env-config.json, at container start (see CMD in Dockerfile).
#
# The app loads that file before assets/config.json and applies both onto its
# `environment` (see src/bootstrap-environment.ts): a setting in config.json
# wins over the same setting given here.
#
# Usage: generate-env-config.sh <output file>
#
# Only variables that are set to a non-empty value are written. If none is,
# the file is left as shipped in the image ("{}"). If the file cannot be
# written, a warning is printed and the file is served unchanged. An invalid
# value fails the container start, so that a typo cannot go unnoticed.
set -eu

OUTPUT="${1:?usage: generate-env-config.sh <output file>}"

# The supported variables (documented in build/README.md):
# <environment variable> <config.json key> <type: string | boolean>
SETTINGS='
SENTRY_DSN               remoteLoggingDsn          string
SENTRY_ENVIRONMENT       remoteLoggingEnvironment  string
SESSION_TYPE             session_type              string
DEMO_MODE                demo_mode                 boolean
USE_INDEXEDDB_ADAPTER    use_indexeddb_adapter     boolean
WEBMASTER_EMAIL          webmaster_email           string
'

entries=""
# read from a here-document rather than a pipe, so that the loop runs in this
# shell (and can collect the entries and exit on an invalid value)
while read -r var key type; do
  [ -n "$var" ] || continue
  # $var is one of the names above, never input
  eval "value=\${$var:-}"
  [ -n "$value" ] || continue

  case "$value" in
    *[[:cntrl:]]*)
      echo "ERROR: $var must not contain control characters (e.g. a line break)" >&2
      exit 1
      ;;
  esac

  case "$type" in
    boolean)
      if [ "$value" != "true" ] && [ "$value" != "false" ]; then
        echo "ERROR: $var must be \"true\" or \"false\", not \"$value\"" >&2
        exit 1
      fi
      ;;
    string)
      # a JSON string: escape backslashes first, then double quotes
      value="\"$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')\""
      ;;
  esac

  entries="${entries:+$entries,
}  \"$key\": $value"
done <<EOF
$SETTINGS
EOF

[ -n "$entries" ] || exit 0

if ! printf '{\n%s\n}\n' "$entries" > "$OUTPUT"; then
  echo "WARN: app settings are set as environment variables but $OUTPUT could not be written - serving the existing file unchanged" >&2
fi
