import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableModule } from "@angular/material/table";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";

import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { Logging } from "../../../logging/logging.service";
import { JsonEditorService } from "../../json-editor/json-editor.service";
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
    MatPaginatorModule,
    MatButtonModule,
    FaIconComponent,
    RouterLink,
  ],
  templateUrl: "./admin-roles-list.component.html",
})
export class AdminRolesListComponent implements OnInit {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly jsonEditorService = inject(JsonEditorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly roles = signal<RoleWithPermissions[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly pagedRoles = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.roles().slice(start, start + this.pageSize());
  });

  readonly displayedColumns = ["name", "description", "permissions"];

  ngOnInit() {
    this.loadRoles();
  }

  private async loadRoles() {
    try {
      this.roles.set(await this.rolePermissionsService.loadRoles());
      this.pageIndex.set(0);
    } catch (err) {
      Logging.error("Failed to load roles:", err);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
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
