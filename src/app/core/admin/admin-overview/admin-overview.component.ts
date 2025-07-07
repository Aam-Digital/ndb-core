import { Component, OnInit } from "@angular/core";
import { AlertService } from "../../alerts/alert.service";
import { BackupService } from "../backup/backup.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfigService } from "../../config/config.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { readFile } from "../../../utils/utils";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { ExtendedAlertConfig } from "../../alerts/alert-config";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { DatePipe, NgForOf } from "@angular/common";
import { DownloadService } from "../../export/download-service/download.service";
import { MatListModule } from "@angular/material/list";
import { RouteTarget } from "../../../route-target";
import { AdminOverviewService } from "./admin-overview.service";
import { JsonEditorService } from "#src/app/core/admin/json-editor/json-editor.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "#src/app/core/config/config";
import moment from "moment";

/**
 * Admin GUI giving administrative users different options/actions.
 */
@UntilDestroy()
@RouteTarget("Admin")
@Component({
  selector: "app-admin-overview",
  templateUrl: "./admin-overview.component.html",
  styleUrls: ["./admin-overview.component.scss"],
  imports: [MatButtonModule, RouterLink, NgForOf, DatePipe, MatListModule],
})
export class AdminOverviewComponent implements OnInit {
  /** all alerts */
  alerts: ExtendedAlertConfig[] = [];

  constructor(
    private alertService: AlertService,
    private backupService: BackupService,
    private downloadService: DownloadService,
    private dbResolver: DatabaseResolverService,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private configService: ConfigService,
    protected adminOverviewService: AdminOverviewService,
    private jsonEditorService: JsonEditorService,
    private entityMapper: EntityMapperService,
  ) {}

  ngOnInit() {
    this.alerts = this.alertService.alerts;
  }

  /**
   * Send a reference of the PouchDB to the browser's developer console for real-time debugging.
   */
  debugDatabase() {
    console.log(
      'You can assign the following to a global variable in the browser console (right click > "Store as global variable") to run actions on the database with your scripts here:',
    );
    console.log("DatabaseResolverService", this.dbResolver);
    console.log('"app" database', this.dbResolver.getDatabase());
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
    await this.downloadService.triggerDownload(configString, "json", "config");
  }

  async uploadConfigFile(inputEvent: Event) {
    const loadedFile = await readFile(this.getFileFromInputEvent(inputEvent));
    await this.configService.saveConfig(JSON.parse(loadedFile));
  }

  editConfig() {
    this.jsonEditorService
      .openJsonEditorDialog(this.configService.exportConfig(true))
      .subscribe(async (result) => {
        if (!result) return;

        const previousConfigBackup = new Config(
          Config.CONFIG_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
          this.configService.exportConfig(true),
        );
        await this.entityMapper.save(previousConfigBackup);

        await this.configService.saveConfig(result);
      });
  }

  async editPermissions() {
    const permissionsConfig = await this.entityMapper
      .load(Config, Config.PERMISSION_KEY)
      .catch(() => new Config(Config.PERMISSION_KEY, {}));

    this.jsonEditorService
      .openJsonEditorDialog(JSON.parse(JSON.stringify(permissionsConfig.data)))
      .subscribe(async (result) => {
        if (!result) return;

        const previousConfigBackup = new Config(
          Config.PERMISSION_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
          permissionsConfig.data,
        );
        await this.entityMapper.save(previousConfigBackup);

        permissionsConfig.data = result;
        await this.entityMapper.save(permissionsConfig);
      });
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
