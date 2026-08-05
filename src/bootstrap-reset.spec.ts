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
      Reflect.deleteProperty(navigator, "serviceWorker");
    }
  });

  type FakeDeleteRequest = Pick<
    IDBOpenDBRequest,
    "onsuccess" | "onerror" | "onblocked" | "error"
  >;

  /** `this` inside the handlers must be the request itself, like the real IDB API */
  function fakeDeleteRequest(
    props: Partial<FakeDeleteRequest> = {},
  ): IDBOpenDBRequest {
    return {
      onsuccess: null,
      onerror: null,
      onblocked: null,
      error: null,
      ...props,
    } as unknown as IDBOpenDBRequest;
  }

  const fakeEvent = new Event("fake");

  const succeedImmediately = (_name: string): IDBOpenDBRequest => {
    const req = fakeDeleteRequest();
    setTimeout(() => req.onsuccess?.(fakeEvent));
    return req;
  };

  /** Stub the globals that jsdom does not provide, returning the spies to assert on */
  function stubBrowserApis(
    dbNames: string[],
    makeDeleteRequest: (name: string) => IDBOpenDBRequest = succeedImmediately,
  ) {
    const deleteDatabase = vi.fn().mockImplementation(makeDeleteRequest);
    const databases = vi
      .fn()
      .mockResolvedValue(
        dbNames.map((name) => ({ name })) as IDBDatabaseInfo[],
      );
    vi.stubGlobal("indexedDB", { databases, deleteDatabase });

    const unregister = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistrations: vi
          .fn()
          .mockResolvedValue([
            { unregister } as unknown as ServiceWorkerRegistration,
          ]),
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

  it("runPendingReset should keep the pending marker if a database deletion fails", async () => {
    sessionStorage.setItem(RESET_PENDING_KEY, "1");
    const deleteError = new DOMException("delete failed");
    stubBrowserApis(["db1"], () => {
      const req = fakeDeleteRequest({ error: deleteError });
      setTimeout(() => req.onerror?.(fakeEvent));
      return req;
    });

    await expect(runPendingReset()).rejects.toBe(deleteError);

    // not cleared, so the next bootstrap retries the reset instead of
    // silently giving up on a database that never actually got deleted
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBe("1");
  });

  it("runPendingReset should log and still complete once a blocked deletion unblocks", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    sessionStorage.setItem(RESET_PENDING_KEY, "1");
    stubBrowserApis(["db1"], () => {
      const req = fakeDeleteRequest();
      // deleteDatabase() has already returned by the time onblocked/onsuccess
      // are assigned, so both must fire asynchronously like the real IDB API
      setTimeout(() => {
        req.onblocked?.(fakeEvent as unknown as IDBVersionChangeEvent);
        req.onsuccess?.(fakeEvent);
      });
      return req;
    });

    await runPendingReset();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("db1"));
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBeNull();
  });
});
