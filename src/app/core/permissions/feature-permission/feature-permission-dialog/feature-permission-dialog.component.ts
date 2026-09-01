import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  resource,
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
import { ROLES_ADMIN_ROUTE } from "../../../admin/admin-role-permissions/role-permissions.service";
import {
  CRUD_ACTION_LABELS,
  CRUD_ACTIONS,
  grantedByAdvancedRuleTooltip,
  grantedByDefaultRoleTooltip,
} from "../../permission-action-labels";
import { DEFAULT_ROLE } from "../../reserved-roles";
import { PermissionsConfigService } from "../../permissions-config.service";
import {
  FEATURE_ACTIONS,
  FeatureAction,
  FeatureActionPermission,
  FeaturePermissionService,
  RoleFeaturePermission,
} from "../feature-permission.service";

/**
 * Input passed to the {@link FeaturePermissionDialogComponent} when opened.
 */
export interface FeaturePermissionDialogData {
  /** the feature's ENTITY_TYPE (e.g. "EmailTemplate") */
  entityType: string;
  /** human-readable (plural) label of the feature, e.g. "Email Templates" */
  entityLabel?: string;
}

/** one checkbox column of the grid */
interface ActionColumn {
  action: FeatureAction;
  label: string;
}

/** one checkbox of a row, with everything the template needs precomputed */
interface PermissionCell {
  action: FeatureAction;
  granted: boolean;
  editable: boolean;
  /** why this checkbox cannot be changed; empty when it is editable */
  lockTooltip: string;
  ariaLabel: string;
}

/** per-role row shown in the dialog grid */
interface RolePermissionRow {
  /** the role's technical name, or the reserved key of the shared default section */
  role: string;
  /** what to show in the first column */
  label: string;
  /** human-readable description from the auth server, if available */
  description?: string;
  /** true for the shared `_default` row shown above the roles */
  isDefaultRow: boolean;
  editable: boolean;
  /** why the whole row cannot be changed; empty when it is editable */
  lockTooltip: string;
  /** one entry per action, in the order of {@link FeaturePermissionDialogComponent.actionColumns} */
  cells: PermissionCell[];
}

/** what the dialog loads before it can display anything */
interface FeaturePermissionRows {
  rows: RolePermissionRow[];
}

/**
 * Dialog to review and edit which user roles can add, read, update or delete the
 * records of a single feature (internal entity type), writing the changes back to
 * the central permissions config via {@link FeaturePermissionService}.
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
export class FeaturePermissionDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<FeaturePermissionDialogComponent>,
  );
  private readonly data = inject<FeaturePermissionDialogData>(MAT_DIALOG_DATA);
  private readonly permissionService = inject(FeaturePermissionService);
  private readonly permissionsConfig = inject(PermissionsConfigService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly snackBar = inject(MatSnackBar);

  /** where to manage the roles and their rules in full */
  readonly rolesAdminRoute = ROLES_ADMIN_ROUTE;

  readonly entityType = this.data.entityType;
  readonly entityLabel = this.data.entityLabel ?? this.data.entityType;

  /**
   * the checkbox columns, in display order, labelled like the columns of the
   * permission matrix in the role administration
   */
  readonly actionColumns: ActionColumn[] = CRUD_ACTIONS.map((action) => ({
    action,
    label: CRUD_ACTION_LABELS[action],
  }));

  readonly permissionRows = resource<FeaturePermissionRows, unknown>({
    loader: () => this.loadPermissionRows(),
  });

  /** the displayed rows, holding the changes made through the checkboxes */
  readonly rows = linkedSignal(() =>
    // value() throws while the resource is in an error state
    this.permissionRows.hasValue() ? this.permissionRows.value().rows : [],
  );

  readonly saving = signal(false);

  private async loadPermissionRows(): Promise<FeaturePermissionRows> {
    const descriptions = await this.loadRoles();
    const roleNames = [...descriptions.keys()];

    if (roleNames.length === 0) {
      throw new Error("no user roles available to configure");
    }

    const state = await this.permissionService.getPermissions(
      this.entityType,
      roleNames,
    );

    return {
      rows: [
        this.toRow(
          state.defaultRules,
          DEFAULT_ROLE.label,
          true,
          DEFAULT_ROLE.appliesTo,
        ),
        ...state.roles.map((role) =>
          this.toRow(role, role.role, false, descriptions.get(role.role)),
        ),
      ],
    };
  }

  private toRow(
    permission: RoleFeaturePermission,
    label: string,
    isDefaultRow: boolean,
    description?: string,
  ): RolePermissionRow {
    return {
      role: permission.role,
      label,
      description,
      isDefaultRow,
      editable: permission.editable,
      lockTooltip: permission.editable
        ? ""
        : this.rowLockTooltip(isDefaultRow, permission),
      cells: this.actionColumns.map((column) =>
        this.toCell(column, permission.actions[column.action], label),
      ),
    };
  }

  private toCell(
    column: ActionColumn,
    permission: FeatureActionPermission,
    rowLabel: string,
  ): PermissionCell {
    return {
      action: column.action,
      granted: permission.granted,
      editable: permission.editable,
      lockTooltip: permission.editable ? "" : this.cellLockTooltip(permission),
      ariaLabel: $localize`:Permission checkbox aria label:${column.label} ${this.entityLabel} as ${rowLabel}`,
    };
  }

  /** the tooltip explaining why a whole row cannot be changed */
  private rowLockTooltip(
    isDefaultRow: boolean,
    permission: RoleFeaturePermission,
  ): string {
    if (isDefaultRow) {
      return grantedByDefaultRoleTooltip();
    }
    return this.cellLockTooltip(permission.actions.read);
  }

  /** the tooltip explaining why a checkbox cannot be changed */
  private cellLockTooltip(permission: FeatureActionPermission): string {
    switch (permission.lockedBy) {
      case "default":
        return grantedByDefaultRoleTooltip();
      case "advanced-rule":
        return grantedByAdvancedRuleTooltip();
      default:
        return "";
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

  /** Update a single checkbox, replacing the array so OnPush re-renders. */
  setAction(role: string, action: FeatureAction, checked: boolean): void {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.role === role
          ? {
              ...row,
              cells: row.cells.map((cell) =>
                cell.action === action ? { ...cell, granted: checked } : cell,
              ),
            }
          : row,
      ),
    );
  }

  async confirm(): Promise<void> {
    this.saving.set(true);
    try {
      // only editable role rows are persisted; the `_default` row and read-only
      // rows are display-only
      const updates = this.rows()
        .filter((row) => row.editable && !row.isDefaultRow)
        .map((row) => ({
          role: row.role,
          actions: Object.fromEntries(
            FEATURE_ACTIONS.map((action) => [
              action,
              row.cells.some((cell) => cell.action === action && cell.granted),
            ]),
          ) as Record<FeatureAction, boolean>,
        }));

      const backup = await this.permissionService.setPermissions(
        this.entityType,
        updates,
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
