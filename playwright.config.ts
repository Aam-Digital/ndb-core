import { defineConfig } from "@playwright/test";
import { platformBrowserDynamicTesting } from "@angular/platform-browser-dynamic/testing";
import "@angular/compiler";
import "tsx/esm";

// Prevent the `scource-map-support` package used by playwright from taking care
// of remapping stack traces. Instead we want Node's native source map support
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

  reporter: [
    ["list"],
    [
      "@argos-ci/playwright/reporter",
      {
        // Let Argos reporter handle uploads (it handles retries automatically)
        uploadToArgos: !!process.env.CI,
        // Don't fail the e2e run if Argos upload fails (e.g. plan quota reached).
        // Undocumented option, see https://github.com/argos-ci/argos-javascript/pull/268
        ignoreUploadFailures: true,
      },
    ],
    [process.env.CI ? "github" : "null"],
  ],
  retries: process.env.CI ? 2 : undefined,
  workers: 1,
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
