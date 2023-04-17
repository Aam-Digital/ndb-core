import { Component, Inject, OnInit } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import * as Sentry from "@sentry/browser";
import { RemoteSession } from "../../session/session-service/remote-session";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { HttpClient } from "@angular/common/http";
import { SyncedSessionService } from "../../session/session-service/synced-session.service";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "../../session/session-service/auth-user";
import { firstValueFrom } from "rxjs";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonModule } from "@angular/material/button";
import { PouchDatabase } from "../../database/pouch-database";

@Component({
  selector: "app-support",
  templateUrl: "./support.component.html",
  styleUrls: ["./support.component.scss"],
  imports: [MatExpansionModule, MatButtonModule],
  standalone: true,
})
export class SupportComponent implements OnInit {
  currentUser: AuthUser;
  currentSyncState: string;
  lastSync: string;
  lastRemoteLogin: string;
  storageInfo: string;
  swStatus: string;
  swLog = "not available";
  userAgent = this.window.navigator.userAgent;
  appVersion: string;
  dbInfo: string;

  constructor(
    private sessionService: SessionService,
    private sw: SwUpdate,
    private database: PouchDatabase,
    private confirmationDialog: ConfirmationDialogService,
    private http: HttpClient,
    @Inject(WINDOW_TOKEN) private window: Window,
    @Inject(LOCATION_TOKEN) private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUser = this.sessionService.getCurrentUser();
    this.appVersion = environment.appVersion;
    this.initCurrentSyncState();
    this.initLastSync();
    this.initLastRemoteLogin();
    this.initStorageInfo();
    this.initSwStatus();
    this.initDbInfo();
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
      localStorage.getItem(SyncedSessionService.LAST_SYNC_KEY) || "never";
  }

  private initLastRemoteLogin() {
    this.lastRemoteLogin =
      localStorage.getItem(RemoteSession.LAST_LOGIN_KEY) || "never";
  }

  private initStorageInfo() {
    const storage = this.window.navigator?.storage;
    if (storage && "estimate" in storage) {
      storage.estimate().then((estimate) => {
        const used = estimate.usage / 1048576;
        const available = estimate.quota / 1048576;
        this.storageInfo = `${used.toFixed(2)}MBs / ${available.toFixed(2)}MBs`;
      });
    }
  }

  private initSwStatus() {
    if (this.sw.isEnabled) {
      this.swStatus = "enabled";
    } else {
      this.swStatus = "not enabled";
    }
    this.window.navigator.serviceWorker.ready
      .then(() =>
        firstValueFrom(this.http.get("/ngsw/state", { responseType: "text" }))
      )
      .then((res) => (this.swLog = res));
  }

  private initDbInfo() {
    this.database
      .getPouchDB()
      .info()
      .then(
        (res) =>
          (this.dbInfo = `${res.doc_count} (update sequence ${res.update_seq})`)
      );
  }

  sendReport() {
    // This is sent even without submitting the crash report.
    Sentry.captureMessage("report information", {
      user: { name: this.currentUser.name },
      level: "debug",
      extra: {
        currentSyncState: this.currentSyncState,
        lastSync: this.lastSync,
        lastRemoteLogin: this.lastRemoteLogin,
        swStatus: this.swStatus,
        userAgent: this.userAgent,
        swLog: this.swLog,
        storageInfo: this.storageInfo,
        dbInfo: this.dbInfo,
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
    const choice = await this.confirmationDialog.getConfirmation(
      "Reset Application",
      "Are you sure you want to reset the application? This will delete all application data from your device and you will have to synchronize again."
    );
    if (!choice) {
      return;
    }

    await this.database.destroy();
    const registrations =
      await this.window.navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map((reg) => reg.unregister());
    await Promise.all(unregisterPromises);
    localStorage.clear();
    this.location.reload();
  }
}
