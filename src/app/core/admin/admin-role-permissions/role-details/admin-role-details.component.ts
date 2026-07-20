import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";

import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { JsonEditorService } from "../../json-editor/json-editor.service";
import { MatrixModel, rulesToMatrix } from "../permission-matrix";
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
    FaIconComponent,
  ],
  templateUrl: "./admin-role-details.component.html",
})
export class AdminRoleDetailsComponent {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly jsonEditorService = inject(JsonEditorService);

  readonly roleName = signal("");
  readonly role = signal<RoleWithPermissions | undefined>(undefined);
  readonly model = signal<MatrixModel | undefined>(undefined);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe()
      .subscribe((params) => {
        this.roleName.set(params.get("role") ?? "");
        this.loadRole();
      });
  }

  async loadRole() {
    const roles = await this.rolePermissionsService.loadRoles();
    const role = roles.find((r) => r.name === this.roleName());
    this.role.set(role);
    this.model.set(role?.rules ? rulesToMatrix(role.rules) : undefined);
  }

  /**
   * Edit this role's rules as raw JSON as a fallback for advanced use cases.
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
