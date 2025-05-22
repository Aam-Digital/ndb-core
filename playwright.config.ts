import { defineConfig } from "@playwright/test";

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
        // Upload in a separate step in CI
        uploadToArgos: false,
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
