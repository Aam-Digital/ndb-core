import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ActivatedRoute, Router } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

import { Logging } from "../../../logging/logging.service";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { UnsavedChangesService } from "../../../entity-details/form/unsaved-changes.service";
import {
  MatrixModel,
  matrixToRules,
  rulesToMatrix,
} from "../permission-matrix";
import { PermissionMatrixComponent } from "../permission-matrix/permission-matrix.component";
import {
  RolePermissionsService,
  RoleWithPermissions,
} from "../role-permissions.service";

const EMPTY_MODEL: MatrixModel = { rows: [], unsupportedRules: [] };

/**
 * Details of one user role, showing its permission rules as an editable matrix.
 * Also used to create a new role (route data `newRole`).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-role-details",
  imports: [
    ViewTitleComponent,
    PermissionMatrixComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FaIconComponent,
  ],
  templateUrl: "./admin-role-details.component.html",
})
export class AdminRoleDetailsComponent {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly unsavedChanges = inject(UnsavedChangesService);

  readonly roleName = signal("");
  readonly role = signal<RoleWithPermissions | undefined>(undefined);
  readonly model = signal<MatrixModel>(EMPTY_MODEL);
  readonly editing = signal(false);
  readonly isNew = signal(false);

  readonly nameControl = new FormControl("", [
    Validators.required,
    Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    (control) =>
      this.existingRoleNames?.has(control.value) ? { duplicate: true } : null,
  ]);
  readonly descriptionControl = new FormControl("");

  private originalModel: MatrixModel = EMPTY_MODEL;
  private existingRoleNames = new Set<string>();

  constructor() {
    if (this.route.snapshot.data["newRole"]) {
      this.initNewRole();
    } else {
      this.nameControl.disable();
      this.route.paramMap.subscribe((params) => {
        this.roleName.set(params.get("role") ?? "");
        this.nameControl.setValue(this.roleName());
        this.loadRole();
      });
    }

    // keep the description form state in sync with the edit mode
    effect(() => {
      if (this.descriptionEditable()) {
        this.descriptionControl.enable();
      } else {
        this.descriptionControl.disable();
      }
    });

    inject(DestroyRef).onDestroy(() =>
      this.unsavedChanges.setUnsavedChanges(this, false),
    );
  }

  private async initNewRole() {
    this.isNew.set(true);
    this.editing.set(true);
    this.model.set(EMPTY_MODEL);
    const roles = await this.rolePermissionsService.loadRoles();
    this.existingRoleNames = new Set(roles.map((r) => r.name));
  }

  async loadRole() {
    const roles = await this.rolePermissionsService.loadRoles();
    const role = roles.find((r) => r.name === this.roleName());
    this.role.set(role);
    this.model.set(rulesToMatrix(role?.rules ?? []));
    this.descriptionControl.setValue(role?.description ?? "");
    this.descriptionControl.markAsPristine();
  }

  /** whether the user may create/delete/update roles in the authentication server */
  readonly canManageRoles = this.rolePermissionsService.canManageRoles();

  readonly deleteDisabledTooltip = $localize`Your account does not have permission to delete roles in the user account server.`;

  /**
   * Description is stored in the authentication server, so it can only be edited
   * for existing realm-backed roles when the user is allowed to manage roles.
   */
  readonly descriptionEditable = computed(
    () =>
      this.canManageRoles &&
      (this.isNew() || (this.editing() && !!this.role()?.keycloakRole)),
  );

  startEditing() {
    this.originalModel = structuredClone(this.model());
    this.editing.set(true);
  }

  onModelChange(updated: MatrixModel) {
    this.model.set(updated);
    this.unsavedChanges.setUnsavedChanges(this, true);
  }

  cancel() {
    if (this.isNew()) {
      this.unsavedChanges.setUnsavedChanges(this, false);
      this.router.navigate([".."], { relativeTo: this.route });
      return;
    }
    this.model.set(this.originalModel);
    this.descriptionControl.setValue(this.role()?.description ?? "");
    this.descriptionControl.markAsPristine();
    this.editing.set(false);
    this.unsavedChanges.setUnsavedChanges(this, false);
  }

  async save() {
    if (this.isNew()) {
      return this.saveNewRole();
    }

    await this.rolePermissionsService.saveRules(
      this.roleName(),
      matrixToRules(this.model()),
    );
    if (this.descriptionControl.dirty && this.role()?.keycloakRole) {
      try {
        await this.rolePermissionsService.updateRoleDescription(
          this.roleName(),
          this.descriptionControl.value ?? "",
        );
      } catch (err) {
        this.showError(
          $localize`Permissions saved, but the role description could not be updated.`,
          err,
        );
      }
    }
    this.editing.set(false);
    this.unsavedChanges.setUnsavedChanges(this, false);
    await this.loadRole();
  }

  private async saveNewRole() {
    this.nameControl.markAsTouched();
    if (this.nameControl.invalid) return;

    const name = this.nameControl.value;
    try {
      await this.rolePermissionsService.createRole(
        name,
        this.descriptionControl.value ?? "",
        matrixToRules(this.model()),
      );
    } catch (err) {
      this.showError(
        $localize`Could not create the role. Your account may not have permission to create roles in the user account server.`,
        err,
      );
      return;
    }

    this.unsavedChanges.setUnsavedChanges(this, false);
    await this.router.navigate(["..", name], {
      relativeTo: this.route,
      replaceUrl: true,
    });
  }

  async deleteRole() {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete role?`,
      $localize`This permanently removes the role "${this.roleName()}" and its permissions. Users currently having this role lose the access it granted. This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await this.rolePermissionsService.deleteRole(this.roleName());
    } catch (err) {
      this.showError(
        $localize`Could not delete the role. Your account may not have permission to delete roles in the user account server.`,
        err,
      );
      return;
    }
    await this.router.navigate([".."], { relativeTo: this.route });
  }

  private showError(message: string, error: unknown) {
    Logging.error("Role management action failed", error);
    this.snackBar.open(message, undefined, { duration: 8000 });
  }
}
