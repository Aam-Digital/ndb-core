import { Component, OnInit } from "@angular/core";
import { AlertService } from "../../../core/alerts/alert.service";
import { BackupService } from "../services/backup.service";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfigService } from "../../../core/config/config.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { readFile } from "../../../utils/utils";
import { RouteTarget } from "../../../app.routing";
import { Database } from "../../../core/database/database";
import { ExtendedAlertConfig } from "../../../core/alerts/alert-config";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { DatePipe, NgForOf } from "@angular/common";
import { DownloadService } from "../../../core/export/download-service/download.service";

/**
 * Admin GUI giving administrative users different options/actions.
 */
@UntilDestroy()
@RouteTarget("Admin")
@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
  imports: [MatButtonModule, RouterLink, NgForOf, DatePipe],
  standalone: true,
})
export class AdminComponent implements OnInit {
  /** all alerts */
  alerts: ExtendedAlertConfig[] = [];

  constructor(
    private alertService: AlertService,
    private backupService: BackupService,
    private downloadService: DownloadService,
    private db: Database,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private configService: ConfigService,
  ) {}

  ngOnInit() {
    this.alerts = this.alertService.alerts;
  }

  /**
   * Send a reference of the PouchDB to the browser's developer console for real-time debugging.
   */
  debugDatabase() {
    console.log(this.db);
  }

  /**
   * Download a full backup of the database as (json) file.
   */
  async saveBackup() {
    const backup = await this.backupService.getDatabaseExport();
    await this.downloadService.triggerDownload(backup, "json", "backup");
  }

  /**
   * Download a full export of the database as csv file.
   */
  async saveCsvExport() {
    const backup = await this.backupService.getDatabaseExport();
    await this.downloadService.triggerDownload(backup, "csv", "export");
  }

  async downloadConfigClick() {
    const configString = this.configService.exportConfig();
    await this.downloadService.triggerDownload(
      configString,
      "json",
      "config.json",
    );
  }

  async uploadConfigFile(inputEvent: Event) {
    const loadedFile = await readFile(this.getFileFromInputEvent(inputEvent));
    await this.configService.saveConfig(JSON.parse(loadedFile));
  }

  /**
   * Reset the database to the state from the loaded backup file.
   * @param inputEvent for the input where a file has been selected
   */
  async loadBackup(inputEvent: Event) {
    const restorePoint = await this.backupService.getDatabaseExport();
    const dataToBeRestored = JSON.parse(
      await readFile(this.getFileFromInputEvent(inputEvent)),
    );

    const confirmed = await this.confirmationDialog.getConfirmation(
      `Overwrite complete database?`,
      `Are you sure you want to restore this backup? This will
      delete all ${restorePoint.length} existing records,
      restoring ${dataToBeRestored.length} records from the loaded file.`,
    );

    if (!confirmed) {
      return;
    }

    await this.backupService.clearDatabase();
    await this.backupService.restoreData(dataToBeRestored, true);

    const snackBarRef = this.snackBar.open(`Backup restored`, "Undo", {
      duration: 8000,
    });
    snackBarRef
      .onAction()
      .pipe(untilDestroyed(this))
      .subscribe(async () => {
        await this.backupService.clearDatabase();
        await this.backupService.restoreData(restorePoint, true);
      });
  }

  private getFileFromInputEvent(inputEvent: Event): Blob {
    const target = inputEvent.target as HTMLInputElement;
    return target.files[0];
  }

  /**
   * Reset the database removing all entities except user accounts.
   */
  async clearDatabase() {
    const restorePoint = await this.backupService.getDatabaseExport();

    const confirmed = await this.confirmationDialog.getConfirmation(
      `Empty complete database?`,
      `Are you sure you want to clear the database? This will delete all existing records in the database!`,
    );

    if (!confirmed) {
      return;
    }

    await this.backupService.clearDatabase();

    const snackBarRef = this.snackBar.open(`Import completed`, "Undo", {
      duration: 8000,
    });
    snackBarRef
      .onAction()
      .pipe(untilDestroyed(this))
      .subscribe(async () => {
        await this.backupService.restoreData(restorePoint, true);
      });
  }
}
