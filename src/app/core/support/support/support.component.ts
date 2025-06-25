import { Component, OnInit, inject } from "@angular/core";
import { WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import * as Sentry from "@sentry/angular";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";
import { firstValueFrom } from "rxjs";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BackupService } from "../../admin/backup/backup.service";
import { DownloadService } from "../../export/download-service/download.service";
import { SyncStateSubject } from "../../session/session-type";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { Entity } from "../../entity/model/entity";
import { SyncedPouchDatabase } from "../../database/pouchdb/synced-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";

@Component({
  selector: "app-support",
  templateUrl: "./support.component.html",
  styleUrls: ["./support.component.scss"],
  imports: [MatExpansionModule, MatButtonModule, MatTooltipModule],
})
export class SupportComponent implements OnInit {
  private syncState = inject(SyncStateSubject);
  private sessionSubject = inject(SessionSubject);
  private currentUserSubject = inject(CurrentUserSubject);
  private sw = inject(SwUpdate);
  private databaseResolver = inject(DatabaseResolverService);
  private http = inject(HttpClient);
  private backupService = inject(BackupService);
  private downloadService = inject(DownloadService);
  private window = inject<Window>(WINDOW_TOKEN);

  sessionInfo: SessionInfo;
  currentUser: Entity;
  currentSyncState: string;
  lastSync: string;
  lastRemoteLogin: string;
  storageInfo: string;
  swStatus: string;
  swLog = "not available";
  userAgent: string;
  appVersion: string;
  dbInfo: string;

  ngOnInit() {
    this.userAgent = this.window.navigator.userAgent;
    this.sessionInfo = this.sessionSubject.value;
    this.currentUser = this.currentUserSubject.value;
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
    this.lastSync =
      localStorage.getItem(
        SyncedPouchDatabase.LAST_SYNC_KEY_PREFIX + Entity.DATABASE,
      ) || "never";
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
    const pouchDb: PouchDB.Database = (
      this.databaseResolver.getDatabase() as PouchDatabase
    )?.getPouchDB?.();
    if (!pouchDb) {
      this.dbInfo = "db not initialized";
      return;
    }

    return pouchDb
      .info()
      .then(
        (res) =>
          (this.dbInfo = `${res.doc_count} (update sequence ${res.update_seq})`),
      );
  }

  sendReport() {
    // This is sent even without submitting the crash report.
    Sentry.captureMessage("report information", {
      user: {
        id: this.sessionInfo?.id,
        email: this.sessionInfo?.email,
        name: this.sessionInfo?.name,
      },
      level: "debug",
      extra: {
        currentUser: this.currentUser?.getId(),
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
        name: this.sessionInfo?.name,
        email: this.sessionInfo?.email,
      },
      title: $localize`:Title user feedback dialog:Support request`,
      subtitle: $localize`:Subtitle user feedback dialog:Please describe the problem you are facing.`,
      subtitle2: "",
    });
  }

  async resetApplication() {
    await this.backupService.resetApplication();
  }

  async downloadLocalDatabase() {
    const backup = await this.backupService.getDatabaseExport();
    await this.downloadService.triggerDownload(
      backup,
      "json",
      "aamdigital_data_" + new Date().toISOString(),
    );
  }
}
