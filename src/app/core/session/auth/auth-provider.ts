/**
 * Available authentication providers.
 */
export enum AuthProvider {
  /**
   * Default auth provider using CouchDB's `_users` database and permission settings.
   * This is the simplest setup as no other service besides the CouchDB is required.
   * However, this provider comes with limited functionality.
   */
  CouchDB = "couchdb",

  /**
   * Keycloak is used to authenticate and manage users.
   * This requires keycloak and potentially other services to be running.
   * Also, the client configuration has to be placed in a file called `keycloak.json` in the `assets` folder.
   */
  Keycloak = "keycloak",
}
