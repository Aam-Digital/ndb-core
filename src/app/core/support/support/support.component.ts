import { Component, Inject, OnInit } from "@angular/core";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import * as Sentry from "@sentry/browser";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { SessionInfo } from "../../session/auth/session-info";
import { firstValueFrom } from "rxjs";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonModule } from "@angular/material/button";
import { PouchDatabase } from "../../database/pouch-database";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BackupService } from "../../admin/backup/backup.service";
import { DownloadService } from "../../export/download-service/download.service";
import { SyncStateSubject } from "../../session/session-type";
import { SyncService } from "../../database/sync.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SessionSubject } from "../../user/user";
import { CurrentlyLoggedInSubject } from "../../session/currently-logged-in";
import { Entity } from "../../entity/model/entity";

@Component({
  selector: "app-support",
  templateUrl: "./support.component.html",
  styleUrls: ["./support.component.scss"],
  imports: [MatExpansionModule, MatButtonModule, MatTooltipModule],
  standalone: true,
})
export class SupportComponent implements OnInit {
  sessionInfo: SessionInfo;
  currentlyLoggedIn: Entity;
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
    private syncState: SyncStateSubject,
    private sessionSubject: SessionSubject,
    private currentlyLoggedInSubject: CurrentlyLoggedInSubject,
    private sw: SwUpdate,
    private database: PouchDatabase,
    private confirmationDialog: ConfirmationDialogService,
    private http: HttpClient,
    private backupService: BackupService,
    private downloadService: DownloadService,
    @Inject(WINDOW_TOKEN) private window: Window,
    @Inject(LOCATION_TOKEN) private location: Location,
  ) {}

  ngOnInit() {
    this.sessionInfo = this.sessionSubject.value;
    this.currentlyLoggedIn = this.currentlyLoggedInSubject.value;
    this.appVersion = environment.appVersion;
    this.initCurrentSyncState();
    this.initLastSync();
    this.initLastRemoteLogin();
    this.initStorageInfo();
    this.initSwStatus();
    return this.initDbInfo();
  }

  private initCurrentSyncState() {
    switch (this.syncState.value) {
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
    this.lastSync = localStorage.getItem(SyncService.LAST_SYNC_KEY) || "never";
  }

  private initLastRemoteLogin() {
    this.lastRemoteLogin =
      localStorage.getItem(KeycloakAuthService.LAST_AUTH_KEY) || "never";
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
        firstValueFrom(this.http.get("/ngsw/state", { responseType: "text" })),
      )
      .then((res) => (this.swLog = res));
  }

  private initDbInfo() {
    if (!this.database || !this.database.getPouchDB()) {
      this.dbInfo = "db not initialized";
      return;
    }

    return this.database
      .getPouchDB()
      .info()
      .then(
        (res) =>
          (this.dbInfo = `${res.doc_count} (update sequence ${res.update_seq})`),
      );
  }

  sendReport() {
    // This is sent even without submitting the crash report.
    Sentry.captureMessage("report information", {
      user: { name: this.sessionInfo.entityId },
      level: "debug",
      extra: {
        currentlyLoggedIn: this.currentlyLoggedIn.getId(true),
        currentSyncState: this.currentSyncState,
        lastSync: this.lastSync,
        lastRemoteLogin: this.lastRemoteLogin,
        swStatus: this.swStatus,
        userAgent: this.userAgent,
        swLog: this.swLog,
        storageInfo: this.storageInfo,
        dbInfo: this.dbInfo,
        timestamp: new Date().toISOString(),
      },
    });
    Sentry.showReportDialog({
      user: {
        name: this.sessionInfo.entityId,
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
      "Are you sure you want to reset the application? This will delete all application data from your device and you will have to synchronize again.",
    );
    if (!choice) {
      return;
    }

    const dbs = await this.window.indexedDB.databases();
    await Promise.all(dbs.map(({ name }) => this.destroyDatabase(name)));

    const registrations =
      await this.window.navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map((reg) => reg.unregister());
    await Promise.all(unregisterPromises);
    localStorage.clear();
    this.location.pathname = "";
  }

  async downloadLocalDatabase() {
    const backup = await this.backupService.getDatabaseExport();
    await this.downloadService.triggerDownload(
      backup,
      "json",
      "aamdigital_data_" + new Date().toISOString(),
    );
  }

  private destroyDatabase(name: string) {
    return new Promise((resolve, reject) => {
      const del = this.window.indexedDB.deleteDatabase(name);
      del.onsuccess = resolve;
      del.onerror = reject;
    });
  }
}
