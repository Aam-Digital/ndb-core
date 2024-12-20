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
  production: true,
  appVersion: "0.0.0", // replaced automatically during docker build
  repositoryId: "Aam-Digital/ndb-core",
  remoteLoggingDsn:
    "https://bd6aba79ca514d35bb06a4b4e0c2a21e@sentry.io/1242399",
  demo_mode: true,
  session_type: SessionType.mock,
  account_url: "https://keycloak.aam-digital.net",
  email: undefined,
  DB_PROXY_PREFIX: "/db",
  DB_NAME: "app",
  notificationsConfig: {} as NotificationConfig,
};
