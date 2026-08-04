import {
  clearLastSyncMarkers,
  LAST_SYNC_KEY_PREFIX,
  RESET_PENDING_KEY,
  runPendingReset,
} from "./bootstrap-reset";

describe("bootstrap-reset", () => {
  let originalServiceWorker: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalServiceWorker = Object.getOwnPropertyDescriptor(
      navigator,
      "serviceWorker",
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.removeItem(RESET_PENDING_KEY);
    // only remove what these tests wrote: localStorage is shared across spec files
    clearLastSyncMarkers();
    localStorage.removeItem("someOtherItem");

    if (originalServiceWorker) {
      Object.defineProperty(navigator, "serviceWorker", originalServiceWorker);
    } else {
      delete (navigator as any).serviceWorker;
    }
  });

  /** Stub the globals that jsdom does not provide, returning the spies to assert on */
  function stubBrowserApis(dbNames: string[]) {
    const deleteDatabase = vi.fn().mockImplementation(() => {
      const req = { onsuccess: null as any, onerror: null as any };
      setTimeout(() => req.onsuccess?.());
      return req as any;
    });
    const databases = vi
      .fn()
      .mockResolvedValue(dbNames.map((name) => ({ name })) as any);
    vi.stubGlobal("indexedDB", { databases, deleteDatabase });

    const unregister = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistrations: vi.fn().mockResolvedValue([{ unregister } as any]),
      },
      configurable: true,
      writable: true,
    });

    return { databases, deleteDatabase, unregister };
  }

  it("clearLastSyncMarkers should only remove the last sync markers", () => {
    localStorage.setItem(LAST_SYNC_KEY_PREFIX + "test-db", "2024-01-01");
    localStorage.setItem("someOtherItem", "someValue");

    clearLastSyncMarkers();

    expect(localStorage.getItem(LAST_SYNC_KEY_PREFIX + "test-db")).toBeNull();
    expect(localStorage.getItem("someOtherItem")).toBe("someValue");
  });

  it("runPendingReset should delete all databases and unregister service workers", async () => {
    sessionStorage.setItem(RESET_PENDING_KEY, "1");
    localStorage.setItem(
      LAST_SYNC_KEY_PREFIX + "test-db",
      "2024-01-01T00:00:00.000Z",
    );
    const { deleteDatabase, unregister } = stubBrowserApis(["db1", "db2"]);

    await runPendingReset();

    expect(deleteDatabase).toHaveBeenCalledWith("db1");
    expect(deleteDatabase).toHaveBeenCalledWith("db2");
    expect(unregister).toHaveBeenCalled();
    expect(localStorage.getItem(LAST_SYNC_KEY_PREFIX + "test-db")).toBeNull();
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBeNull();
  });

  it("runPendingReset should keep Sentry's offline queue of pending logs", async () => {
    sessionStorage.setItem(RESET_PENDING_KEY, "1");
    const { deleteDatabase } = stubBrowserApis(["db1", "sentry-offline"]);

    await runPendingReset();

    expect(deleteDatabase).toHaveBeenCalledWith("db1");
    expect(deleteDatabase).not.toHaveBeenCalledWith("sentry-offline");
  });

  it("runPendingReset should do nothing when no reset is pending", async () => {
    sessionStorage.removeItem(RESET_PENDING_KEY);
    const { databases } = stubBrowserApis(["db1"]);

    await runPendingReset();

    expect(databases).not.toHaveBeenCalled();
  });
});
