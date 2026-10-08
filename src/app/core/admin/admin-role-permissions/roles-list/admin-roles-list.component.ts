import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";

import { ListPaginatorComponent } from "../../../common-components/entities-table/list-paginator/list-paginator.component";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { Logging } from "../../../logging/logging.service";
import { JsonEditorService } from "../../json-editor/json-editor.service";
import { DEFAULT_ROLE } from "../../../permissions/reserved-roles";
import {
  RolePermissionsService,
  RoleWithPermissions,
} from "../role-permissions.service";

/**
 * Admin overview of all user roles and their permission rules,
 * linking to the details of each role.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-roles-list",
  imports: [
    ViewTitleComponent,
    MatTableModule,
    ListPaginatorComponent,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    FaIconComponent,
    RouterLink,
  ],
  templateUrl: "./admin-roles-list.component.html",
  styleUrl: "./admin-roles-list.component.scss",
})
export class AdminRolesListComponent implements OnInit {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly jsonEditorService = inject(JsonEditorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** the roles to display; paging is handled by {@link ListPaginatorComponent} */
  readonly dataSource = new MatTableDataSource<RoleWithPermissions>();

  readonly displayedColumns = ["name", "description", "permissions"];

  /** name and description of the "_default" role, which roles without own rules fall back to */
  readonly defaultRole = DEFAULT_ROLE;

  /** whether the user may create/delete roles in the authentication server (reactive) */
  readonly canManageRoles = this.rolePermissionsService.canManageRoles;

  readonly addDisabledTooltip = $localize`Your account does not have permission to create roles in the user account server.`;

  ngOnInit() {
    this.loadRoles();
  }

  private async loadRoles() {
    try {
      this.dataSource.data = await this.rolePermissionsService.loadRoles();
      // a freshly loaded list starts at the first page: the data source only
      // ever clamps the page index downwards, never resets it
      this.dataSource.paginator?.firstPage();
    } catch (err) {
      Logging.error("Failed to load roles:", err);
    }
  }

  openRoleDetails(role: RoleWithPermissions) {
    this.router.navigate([role.name], { relativeTo: this.route });
  }

  /**
   * Edit the raw permissions config JSON as a fallback for advanced use cases.
   */
  async editJson() {
    const config = await this.rolePermissionsService.loadPermissionsConfig();
    const updatedData = await firstValueFrom(
      this.jsonEditorService.openJsonEditorDialog(config.data),
    );
    if (!updatedData) return;

    await this.rolePermissionsService.savePermissionsConfig(updatedData);
    await this.loadRoles();
  }
}
