import { inject, Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { PouchdbCorruptionRecoveryService } from "./pouchdb/pouchdb-corruption-recovery.service";

type TabChannelMessage = {
  type: "hello" | "ping" | "goodbye";
  tabId: string;
};

/**
 * Detect whether this app is currently open in multiple browser tabs.
 *
 * Detection is best-effort and only active when BroadcastChannel is supported.
 */
@Injectable({ providedIn: "root" })
export class MultiTabDetectionService implements OnDestroy {
  static readonly CHANNEL_NAME = "aam-digital-tab-sync";
  /** How often this tab announces liveness to peers. */
  private static readonly PING_INTERVAL_MS = 2000;
  /** Tab entries older than this are treated as stale and removed. */
  private static readonly STALE_TAB_TIMEOUT_MS = 7000;

  private readonly channel?: BroadcastChannel;
  private readonly tabId = this.generateTabId();
  private readonly otherTabsLastSeenAt = new Map<string, number>();
  private readonly pouchdbCorruptionRecovery = inject(
    PouchdbCorruptionRecoveryService,
    { optional: true },
  );
  private _isMultipleTabsOpen = false;
  private pingIntervalId?: ReturnType<typeof setInterval>;
  /** Emits whenever the multi-tab state changes. */
  readonly isMultipleTabsOpen$ = new BehaviorSubject<boolean>(false);

  /** True if at least one other tab with this app is currently active. */
  get isMultipleTabsOpen(): boolean {
    return this._isMultipleTabsOpen;
  }

  constructor() {
    if ("BroadcastChannel" in globalThis) {
      try {
        this.channel = new BroadcastChannel(
          MultiTabDetectionService.CHANNEL_NAME,
        );
      } catch {
        // Graceful fallback: multi-tab detection disabled on this platform.
      }
    }

    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<TabChannelMessage>) =>
        this.onMessage(event.data);
      this.startPinging();
      this.postMessage("hello");
      globalThis.addEventListener?.("beforeunload", this.handleBeforeUnload);
      this.refreshMultipleTabState();
    }
  }

  private readonly handleBeforeUnload = () => {
    this.postMessage("goodbye");
  };

  /**
   * Processes messages from other tabs and keeps peer-state up to date.
   */
  private onMessage(tabMessage: TabChannelMessage | undefined) {
    if (
      !tabMessage?.type ||
      !tabMessage.tabId ||
      tabMessage.tabId === this.tabId
    ) {
      return;
    }

    if (tabMessage.type === "hello") {
      this.markTabAlive(tabMessage.tabId);
      this.postMessage("ping");
      return;
    }

    if (tabMessage.type === "ping") {
      this.markTabAlive(tabMessage.tabId);
      return;
    }

    if (tabMessage.type === "goodbye") {
      this.otherTabsLastSeenAt.delete(tabMessage.tabId);
      this.refreshMultipleTabState();
    }
  }

  /**
   * Starts periodic pings outside Angular's proxy zone to avoid blocking
   * test stabilization and unnecessary change detection churn.
   */
  private startPinging() {
    const runInterval = () => {
      this.pingIntervalId = setInterval(() => {
        this.postMessage("ping");
        this.removeStaleTabs();
        this.refreshMultipleTabState();
      }, MultiTabDetectionService.PING_INTERVAL_MS);
    };

    const zoneRoot = (
      globalThis as {
        Zone?: { root?: { run?: (fn: () => void) => void } };
      }
    ).Zone?.root;
    if (zoneRoot?.run) {
      zoneRoot.run(runInterval);
      return;
    }

    runInterval();
  }

  /**
   * Marks a remote tab as alive and refreshes multi-tab status.
   */
  private markTabAlive(tabId: string) {
    this.otherTabsLastSeenAt.set(tabId, Date.now());
    this.removeStaleTabs();
    this.refreshMultipleTabState();
  }

  /**
   * Removes peers that have not sent a ping recently.
   */
  private removeStaleTabs() {
    const staleThreshold =
      Date.now() - MultiTabDetectionService.STALE_TAB_TIMEOUT_MS;
    for (const [tabId, lastSeenAt] of this.otherTabsLastSeenAt.entries()) {
      if (lastSeenAt < staleThreshold) {
        this.otherTabsLastSeenAt.delete(tabId);
      }
    }
  }

  /**
   * Publishes whether at least one other active tab is currently detected.
   */
  private refreshMultipleTabState() {
    const hasOtherOpenTabs = this.otherTabsLastSeenAt.size > 0;
    if (this._isMultipleTabsOpen === hasOtherOpenTabs) {
      return;
    }

    this._isMultipleTabsOpen = hasOtherOpenTabs;
    this.isMultipleTabsOpen$.next(hasOtherOpenTabs);
    if (hasOtherOpenTabs) {
      this.pouchdbCorruptionRecovery?.promptMultiTabWarningDialog();
    }
  }

  /**
   * Broadcasts a typed message for this tab to all peers.
   */
  private postMessage(type: TabChannelMessage["type"]) {
    this.channel?.postMessage({
      type,
      tabId: this.tabId,
    } satisfies TabChannelMessage);
  }

  /**
   * Generates a stable per-tab ID used for peer tracking.
   */
  private generateTabId(): string {
    return (
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    );
  }

  ngOnDestroy() {
    this.postMessage("goodbye");
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
    }
    globalThis.removeEventListener?.("beforeunload", this.handleBeforeUnload);
    this.channel?.close();
    this.isMultipleTabsOpen$.complete();
  }
}

/**
 * Detect IndexedDB/PouchDB corruption symptoms commonly observed when the app
 * is used in multiple tabs with concurrent writes.
 *
 * `unknown_error` is the generic PouchDB surface for IndexedDB failures;
 * we intentionally treat all occurrences as potential multi-tab corruption
 * since that is the only known trigger in this app's environment.
 */
export function isKnownMultiTabDatabaseCorruption(error: unknown): boolean {
  const text = errorToText(error).toLowerCase();
  return (
    text.includes("unknown_error") ||
    text.includes("database has a global failure") ||
    (text.includes("constrainterror") && text.includes("seq"))
  );
}

function errorToText(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message}`;
  if (typeof error === "string") return error;
  return JSON.stringify(error ?? "");
}
