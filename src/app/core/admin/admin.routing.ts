import { Routes } from "@angular/router";
import { RoutedViewComponent } from "../ui/routed-view/routed-view.component";
import { AdminComponent } from "./admin/admin.component";
import { ConfigImportComponent } from "../../features/config-setup/config-import/config-import.component";
import { ConflictResolutionListComponent } from "../../features/conflict-resolution/conflict-resolution-list/conflict-resolution-list.component";
import { UserRoleGuard } from "../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../permissions/permission-guard/entity-permission.guard";

export const adminRoutes: Routes = [
  {
    path: "",
    component: AdminComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "entity/:entityType/list",
    component: RoutedViewComponent,
    data: {
      component: "AdminEntityList",
      entity: "Config",
      requiredPermissionOperation: "update",
    },
    canActivate: [EntityPermissionGuard],
  },
  {
    path: "entity/:entityType/details",
    component: RoutedViewComponent,
    data: {
      component: "AdminEntity",
      entity: "Config",
      requiredPermissionOperation: "update",
    },
    canActivate: [EntityPermissionGuard],
  },

  {
    path: "site-settings",
    component: RoutedViewComponent,
    data: {
      component: "EntityDetails",
      config: {
        entity: "SiteSettings",
        id: "global",
        panels: [
          {
            title: $localize`Site Settings`,
            components: [
              {
                component: "Form",
                config: {
                  fieldGroups: [
                    { fields: ["logo", "favicon"] },
                    {
                      fields: [
                        "siteName",
                        "defaultLanguage",
                        "displayLanguageSelect",
                      ],
                    },
                    { fields: ["primary", "secondary", "error", "font"] },
                  ],
                },
              },
            ],
          },
        ],
      },
      requiredPermissionOperation: "update",
    },
    canActivate: [EntityPermissionGuard],
  },
  {
    path: "config-import",
    component: ConfigImportComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "conflicts",
    component: ConflictResolutionListComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
];
