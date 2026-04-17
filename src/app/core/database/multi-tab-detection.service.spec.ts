import { MultiTabDetectionService } from "./multi-tab-detection.service";

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
    const tab1 = new MultiTabDetectionService();
    expect(tab1.isMultipleTabsOpen).toBe(false);

    const tab2 = new MultiTabDetectionService();

    expect(tab1.isMultipleTabsOpen).toBe(true);
    expect(tab2.isMultipleTabsOpen).toBe(true);

    tab1.ngOnDestroy();
    tab2.ngOnDestroy();
  });

  it("should gracefully do nothing when BroadcastChannel is unavailable", () => {
    globalThis.BroadcastChannel = undefined;

    const service = new MultiTabDetectionService();

    expect(service.isMultipleTabsOpen).toBe(false);
    service.ngOnDestroy();
  });
});
