import { SessionType } from "../app/core/session/session-type";

export const environment = {
  production: false,
  appVersion: "test",
  repositoryId: "Aam-Digital/ndb-core",
  remoteLoggingDsn: undefined, // only set for production mode in environment.prod.ts
  demo_mode: false,
  session_type: SessionType.mock,
  account_url: "https://accounts.aam-digital.net",
  email: undefined,
};
