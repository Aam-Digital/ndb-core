import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";

import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { UnsavedChangesService } from "../../../entity-details/form/unsaved-changes.service";
import { JsonEditorService } from "../../json-editor/json-editor.service";
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
    ReactiveFormsModule,
    FaIconComponent,
  ],
  templateUrl: "./admin-role-details.component.html",
})
export class AdminRoleDetailsComponent {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly jsonEditorService = inject(JsonEditorService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly unsavedChanges = inject(UnsavedChangesService);

  readonly roleName = signal("");
  readonly role = signal<RoleWithPermissions | undefined>(undefined);
  readonly model = signal<MatrixModel | undefined>(undefined);
  readonly editing = signal(false);
  readonly isNew = signal(false);

  readonly nameControl = new FormControl("", [
    Validators.required,
    Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    (control) =>
      this.existingRoleNames?.has(control.value) ? { duplicate: true } : null,
  ]);
  readonly descriptionControl = new FormControl("");

  private originalModel: MatrixModel | undefined;
  private existingRoleNames = new Set<string>();

  constructor() {
    if (this.route.snapshot.data["newRole"]) {
      this.initNewRole();
    } else {
      this.route.paramMap.subscribe((params) => {
        this.roleName.set(params.get("role") ?? "");
        this.loadRole();
      });
    }
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
    this.model.set(role?.rules ? rulesToMatrix(role.rules) : undefined);
    this.descriptionControl.setValue(role?.description ?? "");
    this.descriptionControl.markAsPristine();
  }

  /** description can only be stored for roles that exist in the authentication server */
  get descriptionEditable(): boolean {
    return this.isNew() || (this.editing() && !!this.role()?.keycloakRole);
  }

  startEditing() {
    this.originalModel = JSON.parse(JSON.stringify(this.model() ?? null));
    if (!this.model()) {
      this.model.set(EMPTY_MODEL);
    }
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
    this.model.set(this.originalModel ?? undefined);
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
      const updated = await this.rolePermissionsService.updateRoleDescription(
        this.roleName(),
        this.descriptionControl.value ?? "",
      );
      if (!updated) this.showKeycloakSyncWarning();
    }
    this.editing.set(false);
    this.unsavedChanges.setUnsavedChanges(this, false);
    await this.loadRole();
  }

  private async saveNewRole() {
    this.nameControl.markAsTouched();
    if (this.nameControl.invalid) return;

    const name = this.nameControl.value;
    const result = await this.rolePermissionsService.createRole(
      name,
      this.descriptionControl.value ?? "",
      matrixToRules(this.model() ?? EMPTY_MODEL),
    );
    if (!result.keycloakSynced) this.showKeycloakSyncWarning();

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

    const result = await this.rolePermissionsService.deleteRole(
      this.roleName(),
    );
    if (!result.keycloakSynced) this.showKeycloakSyncWarning();
    await this.router.navigate([".."], { relativeTo: this.route });
  }

  private showKeycloakSyncWarning() {
    this.snackBar.open(
      $localize`Could not sync the role with the user account server. Permissions are saved, but the role may not be assignable to accounts. Contact your technical support team.`,
      undefined,
      { duration: 8000 },
    );
  }

  /**
   * Edit this role's rules as raw JSON as a fallback for advanced use cases.
   * Only available in view mode, changes are saved directly.
   */
  async editJson() {
    const updatedRules = await firstValueFrom(
      this.jsonEditorService.openJsonEditorDialog(this.role()?.rules ?? []),
    );
    if (!updatedRules) return;

    await this.rolePermissionsService.saveRules(this.roleName(), updatedRules);
    await this.loadRole();
  }
}
