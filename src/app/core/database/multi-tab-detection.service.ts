import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";

type TabChannelMessage = { type: "TAB_OPENED" | "TAB_ALIVE" };

/**
 * Detect whether this app is currently open in multiple browser tabs.
 *
 * Detection is best-effort and only active when BroadcastChannel is supported.
 */
@Injectable({ providedIn: "root" })
export class MultiTabDetectionService implements OnDestroy {
  static readonly CHANNEL_NAME = "aam-digital-tab-sync";

  private readonly channel?: BroadcastChannel;
  private _isMultipleTabsOpen = false;
  readonly isMultipleTabsOpen$ = new BehaviorSubject<boolean>(false);

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

      // Announce this tab so already-open tabs can reply.
      this.channel.postMessage({
        type: "TAB_OPENED",
      } satisfies TabChannelMessage);
    }
  }

  private onMessage(message: TabChannelMessage | undefined) {
    if (!message?.type) {
      return;
    }

    if (message.type === "TAB_OPENED") {
      this.channel?.postMessage({
        type: "TAB_ALIVE",
      } satisfies TabChannelMessage);
      this.markMultipleTabsOpen();
      return;
    }

    if (message.type === "TAB_ALIVE") {
      this.markMultipleTabsOpen();
    }
  }

  private markMultipleTabsOpen() {
    if (this._isMultipleTabsOpen) {
      return;
    }
    this._isMultipleTabsOpen = true;
    this.isMultipleTabsOpen$.next(true);
  }

  ngOnDestroy() {
    this.channel?.close();
    this.isMultipleTabsOpen$.complete();
  }
}
