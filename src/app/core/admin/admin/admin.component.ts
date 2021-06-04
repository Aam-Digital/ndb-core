import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../app-config/app-config";
import { AlertService } from "../../alerts/alert.service";
import { Alert } from "../../alerts/alert";
import { BackupService } from "../services/backup.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import PouchDB from "pouchdb-browser";
import { ChildPhotoUpdateService } from "../services/child-photo-update.service";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { AttendanceMigrationService } from "../../../child-dev-project/attendance/attendance-migration/attendance-migration.service";
import { NotesMigrationService } from "../../../child-dev-project/notes/notes-migration/notes-migration.service";

/**
 * Admin GUI giving administrative users different options/actions.
 */
@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
})
export class AdminComponent implements OnInit {
  /** app-wide configuration */
  appConfig = AppConfig.settings;

  /** all alerts */
  alerts: Alert[];

  /** direct database instance */
  private db;

  constructor(
    private alertService: AlertService,
    private backupService: BackupService,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private childPhotoUpdateService: ChildPhotoUpdateService,
    private configService: ConfigService,
    private entityMapper: EntityMapperService,
    public attendanceMigration: AttendanceMigrationService,
    public notesMigration: NotesMigrationService
  ) {}

  ngOnInit() {
    this.alerts = this.alertService.alerts;
    this.db = new PouchDB(AppConfig.settings.database.name);
  }

  /**
   * Trigger an automatic detection & update of Child entities' photo filenames.
   */
  updatePhotoFilenames() {
    this.childPhotoUpdateService.updateChildrenPhotoFilenames();
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
    const backup = await this.backupService.getJsonExport();
    this.startDownload(backup, "text/json", "backup.json");
  }

  /**
   * Download a full export of the database as csv file.
   */
  async saveCsvExport() {
    const csv = await this.backupService.getCsvExport();
    this.startDownload(csv, "text/csv", "export.csv");
  }

  async downloadConfigClick() {
    const configString = await this.configService.exportConfig(
      this.entityMapper
    );
    this.startDownload(configString, "text/json", "config.json");
  }

  async uploadConfigFile(file: Blob) {
    const loadedFile = await this.readFile(file);
    await this.configService.saveConfig(
      this.entityMapper,
      JSON.parse(loadedFile)
    );
    await this.configService.loadConfig(this.entityMapper);
  }

  private startDownload(data: string, type: string, name: string) {
    const tempLink = document.createElement("a");
    tempLink.href =
      "data:" + type + ";charset=utf-8," + encodeURIComponent(data);
    tempLink.target = "_blank";
    tempLink.download = name;
    tempLink.click();
  }

  private readFile(file: Blob): Promise<string> {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.addEventListener("load", () =>
        resolve(fileReader.result as string)
      );
      fileReader.readAsText(file);
    });
  }

  /**
   * Reset the database to the state from the loaded backup file.
   * @param file The file object of the backup to be restored
   */
  async loadBackup(file) {
    const restorePoint = await this.backupService.getJsonExport();
    const newData = await this.readFile(file);

    const dialogRef = this.confirmationDialog.openDialog(
      $localize`Overwrite complete database?`,
      $localize`Are you sure you want to restore this backup? This will delete all ${
        restorePoint.split("\n").length
      } existing records in the database, restoring ${
        newData.split("\n").length
      } records from the loaded file.`
    );

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      await this.backupService.clearDatabase();
      await this.backupService.importJson(newData, true);

      const snackBarRef = this.snackBar.open(
        $localize`Backup restored`,
        "Undo",
        {
          duration: 8000,
        }
      );
      snackBarRef.onAction().subscribe(async () => {
        await this.backupService.clearDatabase();
        await this.backupService.importJson(restorePoint, true);
      });
    });
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * @param file The file object of the csv data to be loaded
   */
  async loadCsv(file: Blob) {
    const restorePoint = await this.backupService.getJsonExport();
    const newData = await this.readFile(file);

    const dialogRef = this.confirmationDialog.openDialog(
      $localize`Import new data?`,
      $localize`Are you sure you want to import this file? This will add or update ${
        newData.trim().split("\n").length - 1
      } records from the loaded file. Existing records with same "_id" in the database will be overwritten!`
    );

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      await this.backupService.importCsv(newData, true);

      const snackBarRef = this.snackBar.open(
        $localize`Import completed?`,
        "Undo",
        {
          duration: 8000,
        }
      );
      snackBarRef.onAction().subscribe(async () => {
        await this.backupService.clearDatabase();
        await this.backupService.importJson(restorePoint, true);
      });
    });
  }

  /**
   * Reset the database removing all entities except user accounts.
   */
  async clearDatabase() {
    const restorePoint = await this.backupService.getJsonExport();

    const dialogRef = this.confirmationDialog.openDialog(
      $localize`Empty complete database?`,
      $localize`Are you sure you want to clear the database? This will delete all ${
        restorePoint.split("\n").length
      } existing records in the database!`
    );

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      await this.backupService.clearDatabase();

      const snackBarRef = this.snackBar.open(
        $localize`Import completed`,
        "Undo",
        {
          duration: 8000,
        }
      );
      snackBarRef.onAction().subscribe(async () => {
        await this.backupService.importJson(restorePoint, true);
      });
    });
  }
}
