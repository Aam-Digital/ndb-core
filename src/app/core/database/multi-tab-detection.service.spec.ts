import { TestBed } from "@angular/core/testing";
import { MultiTabDetectionService } from "./multi-tab-detection.service";
import { PouchdbCorruptionRecoveryService } from "./pouchdb/pouchdb-corruption-recovery.service";

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
  let mockRecoveryService: {
    promptMultiTabWarningDialog: ReturnType<typeof vi.fn>;
  };

  function createService() {
    return TestBed.runInInjectionContext(() => new MultiTabDetectionService());
  }

  beforeEach(() => {
    originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = MockBroadcastChannel as any;
    MockBroadcastChannel.reset();
    mockRecoveryService = {
      promptMultiTabWarningDialog: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PouchdbCorruptionRecoveryService,
          useValue: mockRecoveryService,
        },
      ],
    });
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
    MockBroadcastChannel.reset();
  });

  it("should detect when another tab is opened", () => {
    const firstTab = createService();
    expect(firstTab.isMultipleTabsOpen).toBe(false);

    const secondTab = createService();

    expect(firstTab.isMultipleTabsOpen).toBe(true);
    expect(secondTab.isMultipleTabsOpen).toBe(true);
    expect(
      mockRecoveryService.promptMultiTabWarningDialog,
    ).toHaveBeenCalledTimes(2);

    firstTab.ngOnDestroy();
    secondTab.ngOnDestroy();
  });

  it("should reset to single-tab state after other tab is closed", () => {
    const firstTab = createService();
    const secondTab = createService();
    expect(firstTab.isMultipleTabsOpen).toBe(true);

    secondTab.ngOnDestroy();

    expect(firstTab.isMultipleTabsOpen).toBe(false);
    firstTab.ngOnDestroy();
  });

  it("should recover from stale tab entries when a tab disappears", () => {
    vi.useFakeTimers();
    try {
      const firstTab = createService();
      const secondTab = createService();
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

    const service = createService();

    expect(service.isMultipleTabsOpen).toBe(false);
    service.ngOnDestroy();
  });

  it("should not repeatedly show warning while multi-tab state remains true", () => {
    vi.useFakeTimers();
    try {
      const firstTab = createService();
      const secondTab = createService();
      expect(firstTab.isMultipleTabsOpen).toBe(true);

      vi.advanceTimersByTime(10000);

      expect(
        mockRecoveryService.promptMultiTabWarningDialog,
      ).toHaveBeenCalledTimes(2);
      firstTab.ngOnDestroy();
      secondTab.ngOnDestroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
