import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";
import { FirebaseConfiguration } from "./app/features/notification/notification-config.interface";
import { SessionType } from "./app/core/session/session-type";
import { PUBLIC_FORM_ROUTE } from "./app/features/public-form/public-form-routing";

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

  // Public-form routes must run in online-only mode. Apply this regardless
  // of whether config.json was loaded — in dev, the config.json fetch may
  // return early without calling the post-load hooks.
  applyPublicFormSession();

  if (isPublicFormRoute()) {
    // Anonymous public-form users don't authenticate via Keycloak and don't
    // receive push notifications, so skip loading those configs to keep the
    // public-form cold start fast.
    return;
  }

  await initKeycloakConfigToEnvironment();

  await initFirebaseConfigToEnvironment();
}

/**
 * sessionStorage key tracking how many times we've auto-reloaded due to a
 * failure loading config.json, so a persistent failure (e.g. offline) doesn't
 * reload-loop and flood error monitoring.
 */
const CONFIG_JSON_RELOAD_ATTEMPTS_KEY = "config_json_reload_attempts";
const CONFIG_JSON_MAX_RELOAD_ATTEMPTS = 1;

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
    sessionStorage.removeItem(CONFIG_JSON_RELOAD_ATTEMPTS_KEY);
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

    const attempts = Number(
      sessionStorage.getItem(CONFIG_JSON_RELOAD_ATTEMPTS_KEY) ?? "0",
    );
    if (attempts < CONFIG_JSON_MAX_RELOAD_ATTEMPTS) {
      sessionStorage.setItem(
        CONFIG_JSON_RELOAD_ATTEMPTS_KEY,
        String(attempts + 1),
      );
      alert(
        "We couldn't load the base configuration for your system. Trying to reload the app for you. If this problem persists, please contact your tech support.",
      );
      window.location.reload();
    } else {
      alert(
        "We couldn't load the base configuration for your system, even after retrying. Please contact your tech support.",
      );
    }
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
 * Force online-only mode when bootstrapping a public-form route, so the
 * database factory creates a RemotePouchDatabase from the first lazy access
 * rather than a SyncedPouchDatabase that would never be initialized.
 */
function applyPublicFormSession() {
  if (isPublicFormRoute()) {
    environment.session_type = SessionType.online;
  }
}

function isPublicFormRoute(): boolean {
  return window.location.pathname.startsWith(`/${PUBLIC_FORM_ROUTE}/`);
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
    environment.clientId = keycloakConfig["resource"];
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
