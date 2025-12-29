import { Routes } from "@angular/router";
import { RoutedViewComponent } from "../ui/routed-view/routed-view.component";
import { AdminOverviewComponent } from "./admin-overview/admin-overview.component";
import { ConflictResolutionListComponent } from "../../features/conflict-resolution/conflict-resolution-list/conflict-resolution-list.component";
import { UserRoleGuard } from "../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../permissions/permission-guard/entity-permission.guard";
import { SetupWizardComponent } from "./setup-wizard/setup-wizard.component";
import { AdminMenuComponent } from "./admin-menu/admin-menu.component";
import { AdminUserRolesComponent } from "../user/admin-user-roles/admin-user-roles.component";
import { SubscriptionInfoComponent } from "./subscription-info/subscription-info.component";
import { AdvancedFeaturesComponent } from "./advanced-features/advanced-features.component";
import { DataPrivacyComponent } from "./data-privacy/data-privacy.component";
import { UserListComponent } from "../user/user-list/user-list.component";
import { AdminPrimaryActionComponent } from "./admin-primary-action/admin-primary-action.component";

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
    path: "primary-action",
    component: AdminPrimaryActionComponent,
  },
  {
    path: "user-roles",
    component: AdminUserRolesComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "user-list",
    component: UserListComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "subscription-info",
    component: SubscriptionInfoComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "advanced-features",
    component: AdvancedFeaturesComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
  {
    path: "data-privacy",
    component: DataPrivacyComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
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
    path: "dashboard/:dashboardViewId",
    component: RoutedViewComponent,
    data: {
      component: "AdminDashboard",
      entityType: "Config",
      requiredPermissionOperation: "update",
    },
    canActivate: [EntityPermissionGuard],
  },
  {
    path: "matching",
    component: RoutedViewComponent,
    data: {
      component: "AdminMatchingEntities",
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
    path: "conflicts",
    component: ConflictResolutionListComponent,
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: ["admin_app"],
    },
  },
];
