import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";

type TabChannelMessage = {
  type: "TAB_HELLO" | "TAB_HEARTBEAT" | "TAB_GOODBYE";
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
  private static readonly HEARTBEAT_INTERVAL_MS = 2000;
  /** Tab entries older than this are treated as stale and removed. */
  private static readonly STALE_TAB_TIMEOUT_MS = 7000;

  private readonly channel?: BroadcastChannel;
  private readonly tabId = this.generateTabId();
  private readonly otherTabsLastSeenAt = new Map<string, number>();
  private _isMultipleTabsOpen = false;
  private heartbeatTimerId?: ReturnType<typeof setInterval>;
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
      this.startHeartbeat();
      this.postMessage("TAB_HELLO");
      globalThis.addEventListener?.("beforeunload", this.handleBeforeUnload);
      this.refreshMultipleTabState();
    }
  }

  private readonly handleBeforeUnload = () => {
    this.postMessage("TAB_GOODBYE");
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

    if (tabMessage.type === "TAB_HELLO") {
      this.markTabAlive(tabMessage.tabId);
      this.postMessage("TAB_HEARTBEAT");
      return;
    }

    if (tabMessage.type === "TAB_HEARTBEAT") {
      this.markTabAlive(tabMessage.tabId);
      return;
    }

    if (tabMessage.type === "TAB_GOODBYE") {
      this.otherTabsLastSeenAt.delete(tabMessage.tabId);
      this.refreshMultipleTabState();
    }
  }

  /**
   * Starts periodic heartbeats outside Angular's proxy zone to avoid blocking
   * test stabilization and unnecessary change detection churn.
   */
  private startHeartbeat() {
    const startHeartbeatInterval = () => {
      this.heartbeatTimerId = setInterval(() => {
        this.postMessage("TAB_HEARTBEAT");
        this.removeStaleTabs();
        this.refreshMultipleTabState();
      }, MultiTabDetectionService.HEARTBEAT_INTERVAL_MS);
    };

    const zoneRoot = (
      globalThis as {
        Zone?: { root?: { run?: (fn: () => void) => void } };
      }
    ).Zone?.root;
    if (zoneRoot?.run) {
      zoneRoot.run(startHeartbeatInterval);
      return;
    }

    startHeartbeatInterval();
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
   * Removes peers that have not sent heartbeat messages recently.
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
    this.postMessage("TAB_GOODBYE");
    if (this.heartbeatTimerId) {
      clearInterval(this.heartbeatTimerId);
    }
    globalThis.removeEventListener?.("beforeunload", this.handleBeforeUnload);
    this.channel?.close();
    this.isMultipleTabsOpen$.complete();
  }
}

/**
 * Error thrown after known multi-tab IndexedDB corruption was already handled
 * via dedicated recovery UX (dialog).
 *
 * Callers can use this marker to avoid showing duplicate toast warnings.
 */
export class KnownMultiTabCorruptionHandledError extends Error {
  constructor() {
    super("Known multi-tab database corruption handled");
    this.name = "KnownMultiTabCorruptionHandledError";
  }
}

/**
 * Error thrown after a multi-tab usage warning was already shown to the user
 * and the write operation was intentionally blocked.
 */
export class MultiTabOperationBlockedError extends Error {
  constructor() {
    super("Operation blocked because multiple tabs are open");
    this.name = "MultiTabOperationBlockedError";
  }
}

/** Returns true if the error was already handled by multi-tab recovery UX. */
export function isHandledMultiTabError(err: unknown): boolean {
  return (
    err instanceof MultiTabOperationBlockedError ||
    err instanceof KnownMultiTabCorruptionHandledError
  );
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
