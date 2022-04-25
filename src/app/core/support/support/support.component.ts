import { Component, Inject, OnInit } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { DatabaseUser } from "../../session/session-service/local-user";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import { Database } from "../../database/database";
import * as Sentry from "@sentry/browser";
import { Severity } from "@sentry/browser";
import { RemoteSession } from "../../session/session-service/remote-session";
import { RouteTarget } from "../../../app.routing";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

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
    private sw: SwUpdate,
    private database: Database,
    private confirmationDialog: ConfirmationDialogService,
    @Inject(WINDOW_TOKEN) private window: Window,
    @Inject(LOCATION_TOKEN) private location: Location
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
        this.currentSyncState = $localize`:status|something is synced:synced`;
        return;
      case SyncState.STARTED:
        this.currentSyncState = $localize`:status|something is progress:in progress`;
        return;
      default:
        this.currentSyncState = $localize`:status|something is unsynced:unsynced`;
    }
  }

  private initLastSync() {
    this.lastSync =
      localStorage.getItem(SupportComponent.LAST_SYNC_KEY) ||
      $localize`:timestamp|e.g. last sync - never:never`;
  }

  private initLastRemoteLogin() {
    this.lastRemoteLogin =
      localStorage.getItem(RemoteSession.LAST_LOGIN_KEY) ||
      $localize`:timestamp|e.g. last sync - never:never`;
  }

  private initSwStatus() {
    if (this.sw.isEnabled) {
      this.swStatus = $localize`:status|something is enabled:enabled`;
    } else {
      this.swStatus = $localize`:status|something is not enabled:not enabled`;
    }
  }

  sendReport() {
    // This is sent even without submitting the crash report.
    Sentry.captureMessage("report information", {
      user: { name: this.currentUser.name },
      level: Severity.Debug,
      extra: {
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
        email: "example@email.com",
      },
      title: $localize`:Title user feedback dialog:Support request`,
      subtitle: $localize`:Subtitle user feedback dialog:Please describe the problem you are facing.`,
      subtitle2: "",
    });
  }

  async resetApplication() {
    const choice = await this.confirmationDialog
      .openDialog(
        $localize`Reset Application`,
        $localize`Are you sure you want to reset the application? This will delete all application data from your device and you will have to synchronize again.`
      )
      .afterClosed()
      .toPromise();
    if (!choice) {
      return;
    }

    await this.database.destroy();
    const registrations = await this.window.navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map((reg) => reg.unregister());
    await Promise.all(unregisterPromises);
    localStorage.clear();
    this.location.reload();
  }
}
