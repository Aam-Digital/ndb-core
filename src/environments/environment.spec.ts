import { SessionType } from "../app/core/session/session-type";
import type { DataSourceType } from "../app/core/common-components/entities-table/data-source/available-data-sources";

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
  webmaster_email: undefined,
  userAdminApi: "http://localhost:8080",
  realm: "test-realm",
  clientId: "app",
  DB_PROXY_PREFIX: "/db",
  API_PROXY_PREFIX: "/api",
  notificationsConfig: undefined,
  SaaS: false,
  userSupportEnabled: false,
  use_indexeddb_adapter: false,
  translationsCdnUrl: "",
  default_data_source: undefined as DataSourceType | undefined,
  session_type_choice: true,
};
