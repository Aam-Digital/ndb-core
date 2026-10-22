import { SessionType } from "../app/core/session/session-type";
import type { DataSourceType } from "../app/core/common-components/entities-table/data-source/available-data-sources";

/**
 * see environment.ts for explanations
 */
export const environment = {
  production: true,
  appVersion: "0.0.0", // replaced automatically during docker build
  repositoryId: "Aam-Digital/ndb-core",

  remoteLoggingDsn: undefined as string | undefined,
  remoteLoggingEnvironment: undefined as string | undefined,
  demo_mode: true,
  session_type: SessionType.mock,
  webmaster_email: undefined,
  userAdminApi: undefined,
  realm: undefined,
  clientId: undefined,
  DB_PROXY_PREFIX: "/db",
  API_PROXY_PREFIX: "/api",
  notificationsConfig: undefined,
  SaaS: false,
  userSupportEnabled: false,
  use_indexeddb_adapter: false,
  translationsCdnUrl: "https://aam-digital.github.io/ndb-core/locale",

  default_data_source: undefined as DataSourceType | undefined,

  session_type_choice: true,
};
