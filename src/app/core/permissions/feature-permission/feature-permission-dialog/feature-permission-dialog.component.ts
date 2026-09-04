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
  /**
   * In {@link FeaturePermissionDialogComponent.rows} the row's *own* grant, as
   * edited through the checkbox; in
   * {@link FeaturePermissionDialogComponent.displayRows} the effective grant,
   * including what the `_default` row adds on top.
   */
  granted: boolean;
  /**
   * In `rows` whether an advanced rule leaves this checkbox editable at all; in
   * `displayRows` additionally `false` while `_default` grants the action.
   */
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
  /** true when the roles or their permissions could not be loaded at all */
  loadFailed?: boolean;
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
    // a failure is reported as a value rather than a rejected loader, so that
    // the dialog has one state to render and no rejection can escape the
    // resource (see `permissionCheck` in PublicFormPermissionWarningComponent)
    loader: async () => {
      try {
        return await this.loadPermissionRows();
      } catch (error) {
        Logging.error("Failed to load feature permissions", error);
        return { rows: [], loadFailed: true };
      }
    },
  });

  /** whether the roles and their permissions could not be loaded */
  readonly loadFailed = computed(
    () => this.permissionRows.value()?.loadFailed === true,
  );

  /**
   * The edited state, one row per `_default` section and user role, holding each
   * row's *own* grants - i.e. what will be written for it. What a role inherits
   * from the `_default` row is layered on top in {@link displayRows} only.
   */
  readonly rows = linkedSignal(() => this.permissionRows.value()?.rows ?? []);

  /** the actions the `_default` row grants, as currently ticked in this dialog */
  private readonly grantedByDefault = computed(() => {
    const defaultRow = this.rows().find((row) => row.isDefaultRow);
    return new Set(
      defaultRow?.cells
        .filter((cell) => cell.granted)
        .map((cell) => cell.action) ?? [],
    );
  });

  /**
   * The rows as displayed: on a role row an action granted by the `_default` row
   * shows as ticked and locked, and follows changes to the `_default` row
   * immediately, so that removing a shared grant does not silently leave the
   * role rows claiming access.
   */
  readonly displayRows = computed(() => {
    const grantedByDefault = this.grantedByDefault();
    return this.rows().map((row) =>
      row.isDefaultRow ? row : this.applyDefaultGrants(row, grantedByDefault),
    );
  });

  private applyDefaultGrants(
    row: RolePermissionRow,
    grantedByDefault: ReadonlySet<FeatureAction>,
  ): RolePermissionRow {
    if (!row.editable) {
      // an advanced rule decides this row as a whole, `_default` changes nothing
      return row;
    }

    return {
      ...row,
      cells: row.cells.map((cell) =>
        cell.editable && grantedByDefault.has(cell.action)
          ? {
              ...cell,
              granted: true,
              editable: false,
              lockTooltip: grantedByDefaultRoleTooltip(),
            }
          : cell,
      ),
    };
  }

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
      // a whole row is only ever read-only because of an advanced rule - what
      // `_default` grants locks single checkboxes, never the `_default` row itself
      lockTooltip: permission.editable ? "" : grantedByAdvancedRuleTooltip(),
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
    const lockedByAdvancedRule = permission.lockedBy === "advanced-rule";
    return {
      action: column.action,
      // the row's own grant, not the effective one: what `_default` adds is
      // layered on in `displayRows`, so unticking it there reveals this again
      granted: permission.grantedByOwnRule,
      editable: !lockedByAdvancedRule,
      lockTooltip: lockedByAdvancedRule ? grantedByAdvancedRuleTooltip() : "",
      ariaLabel: $localize`:Permission checkbox aria label:${column.label} ${this.entityLabel} as ${rowLabel}`,
    };
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
      // only editable rows are persisted (the `_default` row included); rows
      // decided by an advanced rule are display-only
      const updates = this.rows()
        .filter((row) => row.editable)
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
