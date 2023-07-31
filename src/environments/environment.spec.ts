import { SessionType } from "../app/core/session/session-type";
import { AuthProvider } from "../app/core/session/auth/auth-provider";

export const environment = {
  production: false,
  appVersion: "test",
  repositoryId: "Aam-Digital/ndb-core",
  remoteLoggingDsn: undefined, // only set for production mode in environment.prod.ts
  demo_mode: false,
  session_type: SessionType.mock,
  authenticator: AuthProvider.CouchDB,
  account_url: "https://accounts.aam-digital.net",
  email: undefined,
};
