import {
  isKnownMultiTabDatabaseCorruption,
  MultiTabDetectionService,
} from "./multi-tab-detection.service";

class MockBroadcastChannel {
  public static readonly channels = new Map<
    string,
    Set<MockBroadcastChannel>
  >();

  onmessage: ((event: MessageEvent<any>) => void) | null = null;

  constructor(private readonly name: string) {
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)?.add(this);
  }

  postMessage(data: any) {
    const peers = MockBroadcastChannel.channels.get(this.name) ?? new Set();
    for (const peer of peers) {
      if (peer === this) {
        continue;
      }
      peer.onmessage?.({ data } as MessageEvent<any>);
    }
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }

  static reset() {
    MockBroadcastChannel.channels.clear();
  }
}

describe("MultiTabDetectionService", () => {
  let originalBroadcastChannel: typeof globalThis.BroadcastChannel;

  beforeEach(() => {
    originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = MockBroadcastChannel as any;
    MockBroadcastChannel.reset();
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
    MockBroadcastChannel.reset();
  });

  it("should detect when another tab is opened", () => {
    const firstTab = new MultiTabDetectionService();
    expect(firstTab.isMultipleTabsOpen).toBe(false);

    const secondTab = new MultiTabDetectionService();

    expect(firstTab.isMultipleTabsOpen).toBe(true);
    expect(secondTab.isMultipleTabsOpen).toBe(true);

    firstTab.ngOnDestroy();
    secondTab.ngOnDestroy();
  });

  it("should reset to single-tab state after other tab is closed", () => {
    const firstTab = new MultiTabDetectionService();
    const secondTab = new MultiTabDetectionService();
    expect(firstTab.isMultipleTabsOpen).toBe(true);

    secondTab.ngOnDestroy();

    expect(firstTab.isMultipleTabsOpen).toBe(false);
    firstTab.ngOnDestroy();
  });

  it("should recover from stale tab entries when a tab disappears", () => {
    vi.useFakeTimers();
    try {
      const firstTab = new MultiTabDetectionService();
      const secondTab = new MultiTabDetectionService();
      expect(firstTab.isMultipleTabsOpen).toBe(true);

      // Simulate abrupt tab disappearance without a goodbye signal.
      MockBroadcastChannel.reset();
      vi.advanceTimersByTime(8000);

      expect(firstTab.isMultipleTabsOpen).toBe(false);
      firstTab.ngOnDestroy();
      secondTab.ngOnDestroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should gracefully do nothing when BroadcastChannel is unavailable", () => {
    globalThis.BroadcastChannel = undefined;

    const service = new MultiTabDetectionService();

    expect(service.isMultipleTabsOpen).toBe(false);
    service.ngOnDestroy();
  });
  it("should detect seq index constraint errors", () => {
    const error = new Error(
      "Database has a global failure ConstraintError: Unable to add key to index 'seq': at least one key does not satisfy the uniqueness requirements.",
    );
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(true);
  });

  it("should detect unknown_error from IndexedDB adapter failures", () => {
    const error = {
      message: "unknown_error: Database encountered an unknown error",
    };
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(true);
  });

  it("should detect unknown_error when error is a plain string", () => {
    expect(isKnownMultiTabDatabaseCorruption("unknown_error")).toBe(true);
  });

  it("should not classify unrelated validation errors", () => {
    const error = new Error("validation error: invalid field value");
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should detect bulk save array errors with seq constraint", () => {
    const bulkError = [
      {
        reason:
          "Database has a global failure ConstraintError: Unable to add key to index 'seq'",
      },
    ];
    expect(isKnownMultiTabDatabaseCorruption(bulkError)).toBe(true);
  });
});
