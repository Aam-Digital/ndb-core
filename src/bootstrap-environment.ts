import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";
import { FirebaseConfiguration } from "./app/features/notification/notification-config.interface";

/**
 * Overwrite environment settings with the settings from the `config.json` if present.
 * If no file is found, the environment settings are kept.
 **/
export async function initEnvironmentConfig() {
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

  await initKeycloakConfigToEnvironment();

  await initFirebaseConfigToEnvironment();
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
