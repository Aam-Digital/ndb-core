# Security

We have made both technical and design choices to develop a secure platform.
The Angular framework itself has some in-built protection against common security issues like cross-site scripting attacks (see [Angular > Security](https://angular.io/guide/security)).
Beyond this, the following measures are implemented:

- If deployed including our ["replication-backend"](https://github.com/Aam-Digital/replication-backend), that server-side API also ensures authenticated users can only access and sync data their account has permissions for.
- Password policy enforces users to set a strong password including special characters (either via Keycloak or the platforms user profile form)
- Content Security Policy (CSP) headers restrict connections to and execution of code from sources that are not whitelisted.

## Content Security Policy (CSP)
CSP headers are set in the nginx server being built from the code base to serve the Angular app.
The whitelisted CSP sources can be overwritten and adapted using a docker environment variable `CSP` (the default whitelist is defined in the [Dockerfile](https://github.com/Aam-Digital/ndb-core/blob/master/build/Dockerfile)).

### Whitelisting the index.html
To whitelist a specific script section (currently only in the index.html) a [CSP hash](https://content-security-policy.com/hash/) can be used.
Updating the hash should be necessary only rarely, when that script section changes.

The easiest and most reliable way to get the correct hash is to deploy a production build image and check the browser console.
It states something like `"Refused to execute inline script because it violates the following Content Security Policy directive: "...". Either the 'unsafe-inline' keyword, a hash ('sha256-<RELEVANT HASH>')" or a nonce is required."` from where you can copy the given hash and include/update it in the CSP headers.
Generating the hash by pasting the script into an online generator does not seem to work, probably because code is minified during the build process.
