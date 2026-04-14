import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";
import { FirebaseConfiguration } from "./app/features/notification/notification-config.interface";
import { SessionType } from "./app/core/session/session-type";

/**
 * Overwrite environment settings with the settings from the `config.json` if present.
 * If no file is found, the environment settings are kept.
 **/
export async function initEnvironmentConfig() {
  await initConfigJsonToEnvironment();

  // Initialize remote logging (after the environment is set up)
  Logging.initRemoteLogging({
    dsn: environment.remoteLoggingDsn,
    environment: environment.production ? "production" : "development",
  });

  await initKeycloakConfigToEnvironment();

  await initFirebaseConfigToEnvironment();
}

/**
 * Load basic config values from assets/keycloak.json into environment
 */
async function initConfigJsonToEnvironment() {
  const CONFIG_FILE = "assets/config.json";

  let config: Object;
  try {
    const configResponse = await fetch(CONFIG_FILE);
    config = await configResponse.json();
    if (typeof config !== "object") {
      throw new Error("config.json must be an object");
    }
  } catch (err) {
    if (
      !environment.production ||
      environment.appVersion?.startsWith("pr-") ||
      environment.appVersion === "UNKNOWN" ||
      environment.appVersion === "0.0.0"
    ) {
      // continue in dev versions (e.g. to enable GitHub PR deployments)
      return;
    }

    // if offline, the config.json should be served by the service worker
    // if we cannot get a valid config.json, we won't be able to switch to session_type "synced" and load client data

    Logging.error(err, "failed to load config.json");

    alert(
      "We couldn't load the configuration for your system. Trying to reload the app for you. If this problem persists, please contact your tech support.",
    );
    window.location.reload();
  }

  Object.assign(environment, config);

  // Apply user's online-only preference from localStorage (before Angular DI creates databases)
  applyOnlineOnlyPreference();
}

/**
 * If the user previously opted into online-only mode, override session_type early
 * so that database instances are created with the correct type from the start.
 *
 * This MUST run before Angular bootstraps, because DatabaseFactoryService reads
 * environment.session_type the first time a database is lazily accessed (during
 * Angular DI startup, before LoginComponent even exists). If we waited until
 * LoginComponent ran, the wrong DB class would already have been instantiated.
 *
 * The flow is:
 *   1. User toggles checkbox on login page → LoginComponent writes localStorage
 *   2. Keycloak login triggers a full page reload (redirectUri: location.href)
 *   3. On reload, this function runs and applies the preference to environment
 *   4. Angular DI starts → correct DB class (RemotePouchDatabase) is created
 *
 * See also: LoginComponent.applyOnlineOnlyMode() and ONLINE_ONLY_KEY.
 */
function applyOnlineOnlyPreference() {
  if (
    environment.session_type === SessionType.synced &&
    environment.session_type_choice !== false &&
    localStorage.getItem("session_online_only") === "true"
  ) {
    environment.session_type = SessionType.online;
  }
}

/**
 * Load Keycloak server URL from assets/keycloak.json into environment
 */
async function initKeycloakConfigToEnvironment() {
  const KEYCLOAK_FILE = "assets/keycloak.json";

  try {
    const fileResponse = await fetch(KEYCLOAK_FILE);
    const keycloakConfig = await fileResponse.json();
    if (typeof keycloakConfig !== "object") {
      throw new Error("Error loading keycloak.json: invalid json file format");
    }

    environment.userAdminApi = keycloakConfig["auth-server-url"];
    environment.realm = keycloakConfig["realm"];
  } catch (err) {
    Logging.debug("failed to load keycloak URL for app environment", err);
  }
}

/**
 * Load Push Notifications config for Firebase.
 * Please add assets/firebase-config.json with your own Firebase config
 */
async function initFirebaseConfigToEnvironment() {
  const FIREBASE_CONFIG_FILE = "assets/firebase-config.json";
  let notificationsConfig: FirebaseConfiguration;

  try {
    const firebaseConfigResponse = await fetch(FIREBASE_CONFIG_FILE);
    notificationsConfig = await firebaseConfigResponse.json();
    if (typeof notificationsConfig !== "object") {
      throw new Error("firebase-config.json must be an object");
    }

    environment.notificationsConfig = notificationsConfig;
  } catch (err) {
    Logging.debug("failed to load firebase-config.json", err);
  }
}
