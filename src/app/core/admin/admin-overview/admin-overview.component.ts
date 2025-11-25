import { Component, inject, computed } from "@angular/core";
import { AdminSectionStateService } from "./admin-section-state.service";
import { BackupService } from "../backup/backup.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfigService } from "../../config/config.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { readFile } from "../../../utils/utils";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { DownloadService } from "../../export/download-service/download.service";
import { MatListModule } from "@angular/material/list";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { RouteTarget } from "../../../route-target";
import { MenuItem } from "../../ui/navigation/menu-item";
import { JsonEditorService } from "#src/app/core/admin/json-editor/json-editor.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "#src/app/core/config/config";
import { environment } from "#src/environments/environment";
import moment from "moment";
import { AdminOverviewService } from "./admin-overview.service";

/**
 * Admin GUI giving administrative users different options/actions.
 */
@UntilDestroy()
@RouteTarget("Admin")
@Component({
  selector: "app-admin-overview",
  templateUrl: "./admin-overview.component.html",
  styleUrls: ["./admin-overview.component.scss"],
  imports: [
    MatButtonModule,
    RouterLink,
    MatListModule,
    MatExpansionModule,
    MatIconModule,
  ],
})
export class AdminOverviewComponent {
  private backupService = inject(BackupService);
  private downloadService = inject(DownloadService);
  private dbResolver = inject(DatabaseResolverService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackBar = inject(MatSnackBar);
  private configService = inject(ConfigService);
  protected adminOverviewService = inject(AdminOverviewService);
  private jsonEditorService = inject(JsonEditorService);
  private entityMapper = inject(EntityMapperService);
  private readonly sectionStateService = inject(AdminSectionStateService);

  public templates: MenuItem[] = [];
  public configurationMenuItems: MenuItem[] = [];
  expandedSection = computed(() => this.sectionStateService.getExpanded());

  isSaasEnvironment: boolean;

  constructor() {
    this.templates = this.adminOverviewService.templates;
    this.configurationMenuItems =
      this.adminOverviewService.configurationMenuItems;
    this.isSaasEnvironment = environment.SaaS === true;
  }

  setExpanded(sectionId: string) {
    this.sectionStateService.setExpanded(sectionId);
  }

  isExpanded(sectionId: string): boolean {
    return this.expandedSection() === sectionId;
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
    const originalData = this.configService.exportConfig(true);
    this.jsonEditorService
      .openJsonEditorDialog(originalData)
      .subscribe(async (updatedData) => {
        if (!updatedData) return;

        const previousConfigBackup = new Config(
          Config.CONFIG_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
          originalData,
        );
        await this.entityMapper.save(previousConfigBackup);

        await this.configService.saveConfig(updatedData);

        this.showConfirmationWithUndoOption(async () => {
          await this.configService.saveConfig(originalData);
          await this.entityMapper.remove(previousConfigBackup);
        });
      });
  }

  /**
   * Show a snack bar with undo option and handle undo callback with progress dialog.
   */
  private showConfirmationWithUndoOption(undoAction: () => Promise<void>) {
    const snackBarRef = this.snackBar.open(
      $localize`Configuration updated`,
      $localize`Undo`,
      { duration: 8000 },
    );

    snackBarRef.onAction().subscribe(async () => {
      const progressRef = this.confirmationDialog.showProgressDialog(
        $localize`Reverting configuration changes ...`,
      );
      await undoAction();
      progressRef.close();
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
