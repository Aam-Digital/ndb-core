import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { UserAdminService } from "../../../user/user-admin-service/user-admin.service";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../../config/config";
import { Logging } from "../../../logging/logging.service";
import { FeaturePermissionService } from "../feature-permission.service";

/**
 * Input passed to the {@link FeaturePermissionDialogComponent} when opened.
 */
export interface FeaturePermissionDialogData {
  /** the feature's ENTITY_TYPE (e.g. "EmailTemplate") */
  entityType: string;
  /** human-readable (plural) label of the feature, e.g. "Email Templates" */
  entityLabel?: string;
}

/** per-role row shown in the dialog grid */
interface RolePermissionRow {
  role: string;
  label: string;
  use: boolean;
  manage: boolean;
  /** false when the row is read-only (access comes from an uneditable rule) */
  editable: boolean;
}

/**
 * Dialog to review and edit which user roles can "Use" (read) or "Manage" a
 * single feature (internal entity type), writing the changes back to the central
 * permissions config via {@link FeaturePermissionService}.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-feature-permission-dialog",
  templateUrl: "./feature-permission-dialog.component.html",
  styleUrl: "./feature-permission-dialog.component.scss",
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressBarModule,
    RouterLink,
    FaIconComponent,
    DialogCloseComponent,
    HintBoxComponent,
  ],
})
export class FeaturePermissionDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<FeaturePermissionDialogComponent>,
  );
  private readonly data = inject<FeaturePermissionDialogData>(MAT_DIALOG_DATA);
  private readonly permissionService = inject(FeaturePermissionService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly snackBar = inject(MatSnackBar);

  readonly entityType = this.data.entityType;
  readonly entityLabel = this.data.entityLabel ?? this.data.entityType;

  /** `undefined` while loading */
  readonly roles = signal<RolePermissionRow[] | undefined>(undefined);
  readonly hasComplexRules = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const labels = await this.loadRoleLabels();
      const roleNames = [...labels.keys()];

      if (roleNames.length === 0) {
        this.loadError.set(true);
        this.roles.set([]);
        return;
      }

      const state = await this.permissionService.getPermissions(
        this.entityType,
        roleNames,
      );

      this.roles.set(
        state.roles.map((role) => ({
          role: role.role,
          label: labels.get(role.role) || role.role,
          use: role.use,
          manage: role.manage,
          editable: role.editable,
        })),
      );
      this.hasComplexRules.set(state.hasComplexRules);
    } catch (error) {
      Logging.error("Failed to load feature permissions", error);
      this.loadError.set(true);
      this.roles.set([]);
    }
  }

  /**
   * Collect the roles to display as a name -> label map. Roles known to the auth
   * server (Keycloak) provide human-readable labels; roles already present in the
   * permissions config are merged in so the dialog still works when the Keycloak
   * admin API is not reachable.
   */
  private async loadRoleLabels(): Promise<Map<string, string>> {
    const labels = new Map<string, string>();

    try {
      const allRoles = await firstValueFrom(
        this.userAdminService.getAllRoles(),
      );
      for (const role of allRoles) {
        labels.set(role.name, role.description || role.name);
      }
    } catch (error) {
      Logging.debug(
        "Could not load roles from auth server, using config",
        error,
      );
    }

    const configuredRoles =
      await this.permissionService.getConfiguredRoleNames();
    for (const role of configuredRoles) {
      if (!labels.has(role)) {
        labels.set(role, role);
      }
    }

    return labels;
  }

  async confirm(): Promise<void> {
    const rows = this.roles();
    if (!rows) {
      return;
    }

    this.saving.set(true);
    try {
      // only editable rows are persisted; read-only rows are display-only
      const backup = await this.permissionService.setPermissions(
        this.entityType,
        rows
          .filter((row) => row.editable)
          .map(({ role, use, manage }) => ({ role, use, manage })),
      );
      this.offerUndo(backup);
      this.dialogRef.close(true);
    } catch (error) {
      Logging.error("Failed to save feature permissions", error);
      this.snackBar.open(
        $localize`Could not save permissions. Please try again.`,
        undefined,
        { duration: 5000 },
      );
    } finally {
      this.saving.set(false);
    }
  }

  private offerUndo(backup: Config): void {
    const snackBarRef = this.snackBar.open(
      $localize`Permissions for "${this.entityLabel}" updated`,
      $localize`Undo`,
      { duration: 8000 },
    );
    snackBarRef.onAction().subscribe(async () => {
      const config = await this.entityMapper.load(
        Config,
        Config.PERMISSION_KEY,
      );
      config.data = backup.data;
      await this.entityMapper.save(config);
      await this.entityMapper.remove(backup);
    });
  }
}
