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
import { Logging } from "../../../logging/logging.service";
import { PermissionsConfigService } from "../../permissions-config.service";
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
  /** technical role name (shown as the primary label) */
  role: string;
  /** human-readable description from the auth server, if available */
  description?: string;
  use: boolean;
  manage: boolean;
  /** false when the row is read-only (access comes from an uneditable rule) */
  editable: boolean;
  /** translated accessible label of the row's "Use" checkbox */
  useAriaLabel: string;
  /** translated accessible label of the row's "Manage" checkbox */
  manageAriaLabel: string;
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
  private readonly permissionsConfig = inject(PermissionsConfigService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly entityType = this.data.entityType;
  readonly entityLabel = this.data.entityLabel ?? this.data.entityType;

  /** `undefined` while loading */
  readonly roles = signal<RolePermissionRow[] | undefined>(undefined);
  readonly loadError = signal(false);
  readonly saving = signal(false);

  /** whether some rows are read-only because rules the grid cannot edit apply */
  readonly hasComplexRules = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const descriptions = await this.loadRoles();
      const roleNames = [...descriptions.keys()];

      if (roleNames.length === 0) {
        this.loadError.set(true);
        this.roles.set([]);
        return;
      }

      const state = await this.permissionService.getPermissions(
        this.entityType,
        roleNames,
      );

      this.hasComplexRules.set(state.hasComplexRules);
      this.roles.set(
        state.roles.map((role) => ({
          role: role.role,
          description: descriptions.get(role.role),
          use: role.use,
          manage: role.manage,
          editable: role.editable,
          useAriaLabel: $localize`:Use checkbox aria label:Use ${this.entityLabel} as ${role.role}`,
          manageAriaLabel: $localize`:Manage checkbox aria label:Manage ${this.entityLabel} as ${role.role}`,
        })),
      );
    } catch (error) {
      Logging.error("Failed to load feature permissions", error);
      this.loadError.set(true);
      this.roles.set([]);
    }
  }

  /**
   * Collect the roles to display as a name -> description map. Roles known to the
   * auth server (Keycloak) provide a human-readable description; roles already
   * present in the permissions config are merged in (without a description) so the
   * dialog still works when the Keycloak admin API is not reachable.
   */
  private async loadRoles(): Promise<Map<string, string | undefined>> {
    const roles = new Map<string, string | undefined>();

    try {
      const allRoles = await firstValueFrom(
        this.userAdminService.getAllRoles(),
      );
      for (const role of allRoles) {
        roles.set(role.name, role.description || undefined);
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
      if (!roles.has(role)) {
        roles.set(role, undefined);
      }
    }

    return roles;
  }

  /** Update a single role's "Use" state, replacing the array so OnPush re-renders. */
  setUse(role: string, checked: boolean): void {
    this.roles.update((rows) =>
      rows.map((row) => (row.role === role ? { ...row, use: checked } : row)),
    );
  }

  /** Update a single role's "Manage" state, replacing the array so OnPush re-renders. */
  setManage(role: string, checked: boolean): void {
    this.roles.update((rows) =>
      rows.map((row) =>
        row.role === role ? { ...row, manage: checked } : row,
      ),
    );
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
      this.permissionsConfig.offerUndo(
        backup,
        $localize`Permissions for "${this.entityLabel}" updated`,
      );
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
}
