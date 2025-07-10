import { Routes } from "@angular/router";
import { RoutedViewComponent } from "../ui/routed-view/routed-view.component";
import { AdminOverviewComponent } from "./admin-overview/admin-overview.component";
import { ConfigImportComponent } from "../../features/config-setup/config-import/config-import.component";
import { ConflictResolutionListComponent } from "../../features/conflict-resolution/conflict-resolution-list/conflict-resolution-list.component";
import { UserRoleGuard } from "../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../permissions/permission-guard/entity-permission.guard";
import { SetupWizardComponent } from "./setup-wizard/setup-wizard.component";
import { AdminMenuComponent } from "./admin-menu/admin-menu.component";
import { AdminMatchingEntitiesComponent } from "./admin-matching-entities/admin-matching-entities.component";

export const adminRoutes: Routes = [
  {
    path: "",
    component: AdminOverviewComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "setup-wizard",
    component: SetupWizardComponent,
  },
  {
    path: "menu",
    component: AdminMenuComponent,
  },
  {
    path: "entity",
    component: RoutedViewComponent,
    data: {
      component: "AdminEntityTypes",
      entityType: "Config",
      requiredPermissionOperation: "update",
    },
    canActivate: [EntityPermissionGuard],
  },
  {
    path: "entity/:entityType",
    component: RoutedViewComponent,
    data: {
      component: "AdminEntity",
      entityType: "Config",
      requiredPermissionOperation: "update",
    },
    canActivate: [EntityPermissionGuard],
  },
  {
    path: "matching",
    component: AdminMatchingEntitiesComponent,
    data: {
      entityType: "Config",
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
        entityType: "SiteSettings",
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
