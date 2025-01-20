import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";

/**
 * Overwrite environment settings with the settings from the `config.json` if present.
 * If no file is found, the environment settings are kept.
 **/
export async function initEnvironmentConfig() {
  const CONFIG_FILE = "assets/config.json";
  const FIREBASE_CONFIG_FILE = "assets/firebase-config.json";

  let config: Object;
  let notificationsConfig: Object;
  try {
    const configResponse = await fetch(CONFIG_FILE);
    config = await configResponse.json();
    if (typeof config !== "object") {
      throw new Error("config.json must be an object");
    }

    const firebaseConfigResponse = await fetch(FIREBASE_CONFIG_FILE);
    notificationsConfig = await firebaseConfigResponse.json();
    if (typeof notificationsConfig !== "object") {
      throw new Error("firebase-config.json must be an object");
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

  Object.assign(environment, config, { notificationsConfig });
}
