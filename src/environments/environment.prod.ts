import { SessionType } from "../app/core/session/session-type";

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
};

export const firebaseConfig = {
  apiKey: "AIzaSyAS-AmoAzv_-bRbvm1MMqKaq8t0xjZ7Wqo",
  authDomain: "aam-digital-b8a7b.firebaseapp.com",
  projectId: "aam-digital-b8a7b",
  storageBucket: "aam-digital-b8a7b.firebasestorage.app",
  messagingSenderId: "189059495005",
  appId: "1:189059495005:web:c6bdb0c8c665864b37c9b4",
  vapidKey: "BKkE6EgJBIwRa9-DUSKZpmkMuG7Fak2lZgxda_DPx5kYkeK8cgQM_xqurHqxRNa1b2MuW7-_t9iFbgfuXUsWF5I"
};
