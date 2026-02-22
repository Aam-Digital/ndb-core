import { SessionType } from "../app/core/session/session-type";

/**
 * see environment.ts for explanations
 */
export const environment = {
  production: false,
  appVersion: "test",
  repositoryId: "Aam-Digital/ndb-core",
  remoteLoggingDsn: undefined, // only set for production mode in environment.prod.ts
  demo_mode: false,
  session_type: SessionType.mock,
  email: undefined,
  userAdminApi: "http://localhost:8080",
  realm: "test-realm",
  DB_PROXY_PREFIX: "/db",
  API_PROXY_PREFIX: "/api",
  notificationsConfig: undefined,
  SaaS: false,
  userSupportEnabled: false,
  use_indexeddb_adapter: false,
};
