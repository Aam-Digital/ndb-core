import { SessionType } from "../app/core/session/session-type";

/** Structure of the notification configuration object.
 * This object contains the necessary settings for Cloud Messaging integration.
 */

interface NotificationConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
  enabled: boolean;
}

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
