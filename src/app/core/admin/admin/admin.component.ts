import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../app-config/app-config";
import { AlertService } from "../../alerts/alert.service";
import { Alert } from "../../alerts/alert";
import FileSaver from "file-saver";
import { BackupService } from "../services/backup.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import PouchDB from "pouchdb-browser";
import { ChildPhotoUpdateService } from "../services/child-photo-update.service";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";

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
    private entityMapper: EntityMapperService
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
  saveBackup() {
    this.backupService
      .getJsonExport()
      .then((bac) => this.startDownload(bac, "text/json", "backup.json"));
  }

  /**
   * Download a full export of the database as csv file.
   */
  saveCsvExport() {
    this.backupService
      .getCsvExport()
      .then((csv) => this.startDownload(csv, "text/csv", "export.csv"));
  }

  public downloadConfigClick() {
    const jsonString = this.configService.exportConfig();
    this.startDownload(jsonString, "text/json", "config.json");
  }

  public uploadConfigFile(file) {
    this.readFile(file)
      .then((res) =>
        this.configService.saveConfig(this.entityMapper, JSON.parse(res))
      )
      .then(() => this.configService.loadConfig(this.entityMapper));
  }

  private startDownload(data: string, type: string, name: string) {
    const blob = new Blob([data], { type: type });
    FileSaver.saveAs(blob, name);
  }

  private readFile(file): Promise<string> {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(fileReader.result as string);
      };
      fileReader.readAsText(file);
    });
  }

  /**
   * Reset the database to the state from the loaded backup file.
   * @param file The file object of the backup to be restored
   */
  loadBackup(file) {
    const pRestorePoint = this.backupService.getJsonExport();
    const pLoadedData = this.readFile(file);
    Promise.all([pLoadedData, pRestorePoint]).then((r) => {
      const newData = r[0];
      const restorePoint = r[1];

      const dialogRef = this.confirmationDialog.openDialog(
        "Overwrite complete database?",
        "Are you sure you want to restore this backup? " +
          "This will delete all " +
          restorePoint.split("\n").length +
          " existing records in the database, " +
          "restoring " +
          newData.split("\n").length +
          " records from the loaded file."
      );

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.backupService.clearDatabase();
          this.backupService.importJson(newData, true);

          const snackBarRef = this.snackBar.open("Backup restored", "Undo", {
            duration: 8000,
          });
          snackBarRef.onAction().subscribe(() => {
            this.backupService.clearDatabase();
            this.backupService.importJson(restorePoint, true);
          });
        }
      });
    });
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * @param file The file object of the csv data to be loaded
   */
  loadCsv(file) {
    const pRestorePoint = this.backupService.getJsonExport();
    const pLoadedData = this.readFile(file);
    Promise.all([pLoadedData, pRestorePoint]).then((r) => {
      const newData = r[0];
      const restorePoint = r[1];

      const dialogRef = this.confirmationDialog.openDialog(
        "Import new data?",
        "Are you sure you want to import this file? " +
          "This will add or update " +
          (newData.trim().split("\n").length - 1) +
          " records from the loaded file. " +
          'Existing records with same "_id" in the database will be overwritten!'
      );

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.backupService.importCsv(newData, true);

          const snackBarRef = this.snackBar.open("Import completed", "Undo", {
            duration: 8000,
          });
          snackBarRef.onAction().subscribe(() => {
            this.backupService.clearDatabase();
            this.backupService.importJson(restorePoint, true);
          });
        }
      });
    });
  }

  /**
   * Reset the database removing all entities except user accounts.
   */
  clearDatabase() {
    this.backupService.getJsonExport().then((restorePoint) => {
      const dialogRef = this.confirmationDialog.openDialog(
        "Empty complete database?",
        "Are you sure you want to clear the database? " +
          "This will delete all " +
          restorePoint.split("\n").length +
          " existing records in the database!"
      );

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.backupService.clearDatabase();

          const snackBarRef = this.snackBar.open("Import completed", "Undo", {
            duration: 8000,
          });
          snackBarRef.onAction().subscribe(() => {
            this.backupService.importJson(restorePoint, true);
          });
        }
      });
    });
  }
}
