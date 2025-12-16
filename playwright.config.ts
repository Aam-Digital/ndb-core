import { defineConfig } from "@playwright/test";
import { platformBrowserDynamicTesting } from "@angular/platform-browser-dynamic/testing";
import "tsx/esm";

// Prevent the `scource-map-support` package used by playwright from taking care
// of remapping stack traces. Instead we want Node’s native source map support
// used by `tsx` to work.
delete Error.prepareStackTrace;

platformBrowserDynamicTesting();

// Allow `pouchdb-browser` to be imported in Node
// @ts-expect-error define global variable
globalThis.self = globalThis;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e/tests",
  // Let `tsx` take care of transforming code
  build: { external: ["*"] },

  reporter: [
    ["list"],
    [
      "@argos-ci/playwright/reporter",
      {
        // Let Argos reporter handle uploads (it handles retries automatically)
        uploadToArgos: !!process.env.CI,
      },
    ],
    [process.env.CI ? "github" : "null"],
  ],
  retries: process.env.CI ? 2 : undefined,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: process.env.CI ? true : undefined,

  use: {
    baseURL: "http://localhost:4200",
    trace: "on",
    actionTimeout: 5_000,
    browserName: "chromium",
  },

  timeout: 60_000,

  webServer: process.env.CI
    ? {
        command:
          "serve dist -p 4200 --no-compression --no-request-logging --single",
        url: "http://localhost:4200",
        reuseExistingServer: true,
      }
    : undefined,
});
