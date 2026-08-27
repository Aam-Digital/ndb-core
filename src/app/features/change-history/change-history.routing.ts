import { Routes } from "@angular/router";
import { UserRoleGuard } from "../../core/permissions/permission-guard/user-role.guard";
import { ADMIN_APP_ROLE } from "../../core/permissions/permission-types";

/**
 * Routes of the change log, mounted by the app at `/changelog`.
 *
 * Owned by this feature rather than the admin module, so the admin routing does
 * not have to import from `features/`. Still restricted to the administration
 * role: the audit data spans every record, including ones a given user may not
 * be permitted to open.
 */
export const changeHistoryRoutes: Routes = [
  {
    path: "",
    // loaded on demand: this module itself stays eager, because its constructor
    // registers the per-record history action for every entity details view,
    // but the log is a rarely visited admin screen and need not be bundled with it
    loadComponent: () =>
      import("./change-log/change-log.component").then(
        (c) => c.ChangeLogComponent,
      ),
    canActivate: [UserRoleGuard],
    data: {
      permittedUserRoles: [ADMIN_APP_ROLE],
    },
  },
];
