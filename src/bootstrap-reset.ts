/**
 * Reset of all locally stored application data, executed during bootstrap.
 *
 * This module is imported by `main.ts` and therefore evaluated *before*
 * `initLanguage()` has loaded any translations. Like `bootstrap-i18n.ts` and
 * `bootstrap-environment.ts` it must not import anything from `src/app/`, so
 * that bootstrapping does not pull the application's dependency graph into the
 * pre-i18n phase (see app/core/language/README.md).
 */

/**
 * sessionStorage key used to signal that a reset is pending.
 * Set before a page reload; checked on the next bootstrap in {@link runPendingReset}.
 */
export const RESET_PENDING_KEY = "__RESET_PENDING";

/**
 * localStorage key prefix under which `SyncedPouchDatabase` records when a
 * database last completed a sync (one key per database).
 */
export const LAST_SYNC_KEY_PREFIX = "LAST_SYNC_";

/**
 * Remove the "last sync" marker of every database, so that no previous sync is
 * assumed to have happened on this device.
 *
 * This accesses the real localStorage directly rather than the injectable
 * LOCAL_STORAGE_TOKEN, because it also runs before Angular exists.
 * Callers that need this mockable should wrap it in an instance method first.
 */
export function clearLastSyncMarkers() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(LAST_SYNC_KEY_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

/**
 * Run pending reset cleanup before Angular bootstraps.
 * Called from main.ts so that IndexedDB databases are deleted while
 * no PouchDB connections are open (eliminating race conditions).
 */
export async function runPendingReset(): Promise<void> {
  if (!sessionStorage.getItem(RESET_PENDING_KEY)) {
    return;
  }
  clearLastSyncMarkers();

  // Delete all IndexedDB databases
  // (keep Sentry's offline queue so pending diagnostic logs about the reset
  // itself still reach remote logging after the reload)
  const dbs = await indexedDB.databases();
  await Promise.all(
    dbs
      .filter(({ name }) => name !== "sentry-offline")
      .map(
        ({ name }) =>
          new Promise<void>((resolve, reject) => {
            const del = indexedDB.deleteDatabase(name);
            del.onsuccess = () => resolve();
            del.onerror = () => reject(del.error);
            // Another open tab still has a connection to this database (e.g.
            // Firebase's databases, which never close on request). The browser
            // keeps the deletion pending until that tab is closed, so ask the
            // user to do that - otherwise the app just seems to load forever.
            del.onblocked = () => {
              console.warn(
                `Reset pending: deleting IndexedDB database "${name}" is blocked by another open tab.`,
              );
              showCloseOtherTabsNotice();
            };
          }),
      ),
  );

  // Unregister all service workers
  if (navigator.serviceWorker) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
  }

  // Only clear the marker once cleanup actually succeeded, so a failure
  // (rejected promise, thrown error) leaves it in place for a retry on the
  // next bootstrap instead of silently abandoning the reset.
  sessionStorage.removeItem(RESET_PENDING_KEY);
}

/** id of the notice on the loading screen, see {@link showCloseOtherTabsNotice} */
export const CLOSE_OTHER_TABS_NOTICE_ID = "reset-close-other-tabs-notice";

/**
 * Ask the user on the static loading screen (`index.html`) to close other tabs,
 * because they block the reset (and therefore the app start) until closed.
 *
 * The text is English only, like the rest of the loading screen:
 * translations are not loaded yet at this point of the bootstrap.
 * Angular replaces the loading screen (incl. this notice) once the app starts.
 */
function showCloseOtherTabsNotice() {
  if (document.getElementById(CLOSE_OTHER_TABS_NOTICE_ID)) {
    return;
  }
  const notice = document.createElement("p");
  notice.id = CLOSE_OTHER_TABS_NOTICE_ID;
  notice.style.fontWeight = "bold";
  notice.textContent =
    "Resetting the local data on this device. Please close all other tabs and windows of Aam Digital to continue.";
  const heading = document.querySelector("app-root h1");
  if (heading) {
    heading.after(notice);
  } else {
    document.body.prepend(notice);
  }
}
