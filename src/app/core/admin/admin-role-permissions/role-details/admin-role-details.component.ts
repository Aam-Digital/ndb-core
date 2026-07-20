import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ActivatedRoute } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";

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

/**
 * Details of one user role, showing its permission rules as an editable matrix.
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
    FaIconComponent,
  ],
  templateUrl: "./admin-role-details.component.html",
})
export class AdminRoleDetailsComponent {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly jsonEditorService = inject(JsonEditorService);

  private readonly unsavedChanges = inject(UnsavedChangesService);

  readonly roleName = signal("");
  readonly role = signal<RoleWithPermissions | undefined>(undefined);
  readonly model = signal<MatrixModel | undefined>(undefined);
  readonly editing = signal(false);

  private originalModel: MatrixModel | undefined;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe()
      .subscribe((params) => {
        this.roleName.set(params.get("role") ?? "");
        this.loadRole();
      });
    inject(DestroyRef).onDestroy(() =>
      this.unsavedChanges.setUnsavedChanges(this, false),
    );
  }

  async loadRole() {
    const roles = await this.rolePermissionsService.loadRoles();
    const role = roles.find((r) => r.name === this.roleName());
    this.role.set(role);
    this.model.set(role?.rules ? rulesToMatrix(role.rules) : undefined);
  }

  startEditing() {
    this.originalModel = JSON.parse(JSON.stringify(this.model() ?? null));
    if (!this.model()) {
      this.model.set({ rows: [], unsupportedRules: [] });
    }
    this.editing.set(true);
  }

  onModelChange(updated: MatrixModel) {
    this.model.set(updated);
    this.unsavedChanges.setUnsavedChanges(this, true);
  }

  cancel() {
    this.model.set(this.originalModel ?? undefined);
    this.editing.set(false);
    this.unsavedChanges.setUnsavedChanges(this, false);
  }

  async save() {
    await this.rolePermissionsService.saveRules(
      this.roleName(),
      matrixToRules(this.model()),
    );
    this.editing.set(false);
    this.unsavedChanges.setUnsavedChanges(this, false);
    await this.loadRole();
  }

  /**
   * Edit this role's rules as raw JSON as a fallback for advanced use cases.
   * While in edit mode this only updates the pending working state,
   * otherwise changes are saved directly.
   */
  async editJson() {
    const currentRules = this.editing()
      ? matrixToRules(this.model() ?? { rows: [], unsupportedRules: [] })
      : (this.role()?.rules ?? []);
    const updatedRules = await firstValueFrom(
      this.jsonEditorService.openJsonEditorDialog(currentRules),
    );
    if (!updatedRules) return;

    if (this.editing()) {
      this.onModelChange(rulesToMatrix(updatedRules));
    } else {
      await this.rolePermissionsService.saveRules(
        this.roleName(),
        updatedRules,
      );
      await this.loadRole();
    }
  }
}
