import { NotificationConfig } from "app/features/notification/notification-config.interface";
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
  account_url: "https://accounts.aam-digital.net",
  email: undefined,
  DB_PROXY_PREFIX: "/db",
  DB_NAME: "app",
  notificationsConfig: {} as NotificationConfig,
};
