import type { MockInstance } from "vitest";
import { initEnvironmentConfig } from "./bootstrap-environment";
import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";

describe("initEnvironmentConfig", () => {
  const ENV_DSN = "https://env@sentry.example/1";
  const CONFIG_DSN = "https://config@sentry.example/2";

  /** the deployment's files by path; a path without an entry is answered with a 404 */
  let files: Record<string, unknown>;
  let originalEnvironment: Record<string, unknown>;
  let initRemoteLogging: MockInstance;
  let alertSpy: MockInstance;
  let originalLocation: PropertyDescriptor | undefined;

  beforeEach(() => {
    // other spec files replace window.location (without a pathname) and the test runner shares it
    originalLocation = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      value: { pathname: "/", reload: vi.fn() },
      writable: true,
      configurable: true,
    });
    files = {};
    vi.spyOn(window, "fetch").mockImplementation(async (url) =>
      String(url) in files
        ? new Response(JSON.stringify(files[String(url)]))
        : new Response("<html>Not Found</html>", { status: 404 }),
    );
    initRemoteLogging = vi
      .spyOn(Logging, "initRemoteLogging")
      .mockImplementation(() => undefined);
    vi.spyOn(Logging, "error").mockImplementation(() => undefined);
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    // the environment is shared by all spec files, so it has to be handed back unchanged
    originalEnvironment = { ...environment };
    // a release, which does not start without a valid config
    environment.production = true;
    environment.appVersion = "1.0.0";
  });

  afterEach(() => {
    const env = environment as Record<string, unknown>;
    for (const key of Object.keys(env)) {
      if (!(key in originalEnvironment)) {
        delete env[key];
      }
    }
    Object.assign(environment, originalEnvironment);
    sessionStorage.removeItem("config_json_reload_attempts");
    if (originalLocation) {
      Object.defineProperty(window, "location", originalLocation);
    }
    vi.restoreAllMocks();
  });

  it.each([
    [
      "applies a setting only given as environment variable",
      { remoteLoggingDsn: ENV_DSN },
      { webmaster_email: "admin@example.com" },
      { remoteLoggingDsn: ENV_DSN, webmaster_email: "admin@example.com" },
    ],
    [
      "lets config.json win over an environment variable",
      { remoteLoggingDsn: ENV_DSN, remoteLoggingEnvironment: "env" },
      { remoteLoggingDsn: CONFIG_DSN },
      { remoteLoggingDsn: CONFIG_DSN, remoteLoggingEnvironment: "env" },
    ],
    [
      "ignores a missing env-config.json",
      undefined,
      { remoteLoggingDsn: CONFIG_DSN },
      { remoteLoggingDsn: CONFIG_DSN },
    ],
    [
      "ignores an env-config.json that is not an object",
      ["not", "an", "object"],
      { remoteLoggingDsn: CONFIG_DSN },
      { remoteLoggingDsn: CONFIG_DSN },
    ],
  ])("%s", async (_, envConfig, config, expected) => {
    if (envConfig !== undefined) {
      files["assets/env-config.json"] = envConfig;
    }
    files["assets/config.json"] = config;

    await initEnvironmentConfig();

    expect(environment).toMatchObject(expected);
    expect(initRemoteLogging).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: expected.remoteLoggingDsn }),
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("starts without a config.json if the environment variables set the session type", async () => {
    files["assets/env-config.json"] = { session_type: "online" };

    await initEnvironmentConfig();

    expect(environment.session_type).toBe("online");
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("still requires a config.json if the environment variables do not set the session type", async () => {
    files["assets/env-config.json"] = { remoteLoggingDsn: ENV_DSN };
    // the reload has been tried already, so that the test does not navigate
    sessionStorage.setItem("config_json_reload_attempts", "1");

    await initEnvironmentConfig();

    expect(alertSpy).toHaveBeenCalled();
  });
});
