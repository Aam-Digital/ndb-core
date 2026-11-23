import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AdminSectionStateService } from "./admin-section-state.service";
import { BackupService } from "../backup/backup.service";
import { SystemResetService } from "../system-reset/system-reset.service";
import { LocalDeviceResetService } from "../../database/local-device-reset.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { readFile } from "../../../utils/utils";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { DownloadService } from "../../export/download-service/download.service";
import { MatListModule } from "@angular/material/list";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouteTarget } from "../../../route-target";
import { MenuItem } from "../../ui/navigation/menu-item";
import { environment } from "#src/environments/environment";
import { AdminOverviewService } from "./admin-overview.service";
import { SetupWizardService } from "../setup-wizard/setup-wizard.service";
import { SETUP_WIZARD_ROUTE } from "../setup-wizard/setup-wizard-config";
import { WarningNotOptimizedForSmallScreenComponent } from "#src/app/core/common-components/warning-not-optimized-for-small-screen/warning-not-optimized-for-small-screen.component";
import { ApiClientService } from "#src/app/features/api-client/api-client.service";
import { SessionSubject } from "#src/app/core/session/auth/session-info";
import { UserAdminService } from "#src/app/core/user/user-admin-service/user-admin.service";
import { ADMIN_APP_ROLE } from "#src/app/core/permissions/permission-types";

/**
 * Admin GUI giving administrative users different options/actions.
 */
@UntilDestroy()
@RouteTarget("Admin")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-overview",
  templateUrl: "./admin-overview.component.html",
  styleUrls: ["./admin-overview.component.scss"],
  imports: [
    MatButtonModule,
    RouterLink,
    MatListModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    WarningNotOptimizedForSmallScreenComponent,
  ],
})
export class AdminOverviewComponent {
  private backupService = inject(BackupService);
  private readonly systemResetService = inject(SystemResetService);
  private readonly localDeviceResetService = inject(LocalDeviceResetService);
  private downloadService = inject(DownloadService);
  private dbResolver = inject(DatabaseResolverService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackBar = inject(MatSnackBar);
  protected adminOverviewService = inject(AdminOverviewService);
  private readonly sectionStateService = inject(AdminSectionStateService);
  private readonly setupWizardService = inject(SetupWizardService);

  private readonly apiClientService = inject(ApiClientService);
  private readonly userRoles = inject(SessionSubject).value?.roles ?? [];
  private readonly hasApiAccessRoles = [
    ADMIN_APP_ROLE,
    UserAdminService.ACCOUNT_MANAGER_ROLE,
  ].every((role) => this.userRoles.includes(role));
  protected readonly isApiAccessAvailable = computed(
    () => this.hasApiAccessRoles && this.apiClientService.isAvailable(),
  );

  public templates: MenuItem[] = [];

  public readonly configurationMenuItems = computed<MenuItem[]>(() =>
    this.adminOverviewService.configurationMenuItems.filter(
      (item) =>
        item.link !== SETUP_WIZARD_ROUTE || this.setupWizardService.exists(),
    ),
  );
  expandedSection = computed(() => this.sectionStateService.getExpanded());

  isSaasEnvironment: boolean;

  constructor() {
    this.templates = this.adminOverviewService.templates;
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

  async emptyRecords() {
    await this.systemResetService.emptyRecords();
  }

  async resetSystem() {
    await this.systemResetService.resetSystem();
  }

  async resetLocalDevice() {
    await this.localDeviceResetService.resetLocalDevice();
  }
}
