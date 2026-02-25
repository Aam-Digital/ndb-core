import { SessionType } from "../app/core/session/session-type";

/**
 * see environment.ts for explanations
 */
export const environment = {
  production: true,
  appVersion: "0.0.0", // replaced automatically during docker build
  repositoryId: "Aam-Digital/ndb-core",

  // add via config.json overwrite. Default DSN value will be removed in future
  remoteLoggingDsn:
    "https://bd6aba79ca514d35bb06a4b4e0c2a21e@sentry.io/1242399",
  demo_mode: true,
  session_type: SessionType.mock,
  email: undefined,
  userAdminApi: undefined,
  realm: undefined,
  DB_PROXY_PREFIX: "/db",
  API_PROXY_PREFIX: "/api",
  notificationsConfig: undefined,
  SaaS: false,
  userSupportEnabled: false,
  use_indexeddb_adapter: false,
};
