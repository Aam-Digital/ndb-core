import { Component, Inject, OnInit } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { DatabaseUser } from "../../session/session-service/local-user";
import { WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import { Database } from "../../database/database";
import * as Sentry from "@sentry/browser";
import { Severity } from "@sentry/browser";
import { RemoteSession } from "../../session/session-service/remote-session";
import { RouteTarget } from "../../../app.routing";

@RouteTarget("Support")
@Component({
  selector: "app-support",
  templateUrl: "./support.component.html",
  styleUrls: ["./support.component.scss"],
})
export class SupportComponent implements OnInit {
  static readonly LAST_SYNC_KEY = "LAST_SYNC";
  currentUser: DatabaseUser;
  currentSyncState: string;
  lastSync: string;
  lastRemoteLogin: string;
  swStatus: string;
  userAgent = this.window.navigator.userAgent;

  constructor(
    private sessionService: SessionService,
    @Inject(WINDOW_TOKEN) private window: Window,
    private sw: SwUpdate,
    private database: Database
  ) {}

  ngOnInit(): void {
    this.currentUser = this.sessionService.getCurrentUser();
    this.initCurrentSyncState();
    this.initLastSync();
    this.initLastRemoteLogin();
    this.initSwStatus();
  }

  private initCurrentSyncState() {
    switch (this.sessionService.syncState.value) {
      case SyncState.COMPLETED:
        this.currentSyncState = "synced";
        return;
      case SyncState.STARTED:
        this.currentSyncState = "in progress";
        return;
      default:
        this.currentSyncState = "unsynced";
    }
  }

  private initLastSync() {
    this.lastSync =
      localStorage.getItem(SupportComponent.LAST_SYNC_KEY) || "never";
  }

  private initLastRemoteLogin() {
    this.lastRemoteLogin =
      localStorage.getItem(RemoteSession.LAST_LOGIN_KEY) || "never";
  }

  private initSwStatus() {
    if (this.sw.isEnabled) {
      this.swStatus = "enabled";
    } else {
      this.swStatus = "not enabled";
    }
  }

  sendReport() {
    Sentry.addBreadcrumb({
      type: "report information",
      data: {
        currentSyncState: this.currentSyncState,
        lastSync: this.lastSync,
        lastRemoteLogin: this.lastRemoteLogin,
        swStatus: this.swStatus,
        userAgent: this.userAgent,
      },
    });
    Sentry.showReportDialog({
      user: {
        name: this.currentUser.name,
      },
    });
  }

  async resetApplication() {
    await this.database.destroy();
    const registrations = await this.window.navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map((reg) => reg.unregister());
    await Promise.all(unregisterPromises);
    localStorage.clear();
  }
}
