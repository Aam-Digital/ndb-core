import { Routes } from "@angular/router";
import { EntityPermissionGuard } from "../../core/permissions/permission-guard/entity-permission.guard";

/**
 * Routes of the change log, mounted by the app at `/change-history`.
 *
 * Owned by this feature rather than the admin module, so the admin routing does
 * not have to import from `features/`. Gated on read access to the audit data
 * itself, which is the permission the entry point in the entity list offers it
 * on - so the link and the route agree on who gets in.
 */
export const changeHistoryRoutes: Routes = [
  {
    path: "",
    // loaded on demand: this module itself stays eager, because its constructor
    // registers the per-record history action for every entity details view,
    // but the log is a rarely visited admin screen and need not be bundled with it
    loadComponent: () =>
      import("./change-history-list/change-history-list.component").then(
        (c) => c.ChangeHistoryListComponent,
      ),
    canActivate: [EntityPermissionGuard],
    data: {
      entityType: "AuditRecord",
      requiredPermissionOperation: "read",
    },
  },
];
