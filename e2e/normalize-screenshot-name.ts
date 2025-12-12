// This helper normalizes screenshot names for Argos CI so that retries do not create separate paths.
// Usage: import and use getNormalizedScreenshotName in your argosScreenshot calls.

/**
 * Removes Playwright retry suffixes from screenshot names.
 * E.g. "dashboard-retry1" => "dashboard"
 */
export function getNormalizedScreenshotName(name: string): string {
  // Remove any trailing -retryN (e.g. -retry1, -retry2)
  return name.replace(/-retry\d+$/, "");
}
