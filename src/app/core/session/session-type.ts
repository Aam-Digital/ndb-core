/**
 * Available Session types with their keys that can be used in the app-config.
 */
export enum SessionType {
  /**
   * synced local PouchDB and remote CouchDB connection
   */
  synced = "synced",

  /**
   * local only demo mode - PouchDB database without a remote sync counterpart
   */
  local = "local",

  /**
   * in-memory mock implementation of the database interface
   */
  mock = "mock",
}
