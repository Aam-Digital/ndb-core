import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AbstractPermissionGuard } from "./abstract-permission.guard";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { SessionSubject } from "../../session/auth/session-info";

/**
 * A guard that checks the roles of the current user against the permissions which are saved in the route data.
 */
@Injectable()
export class UserRoleGuard extends AbstractPermissionGuard {
  private sessionInfo = inject(SessionSubject);

  constructor() {
    const router = inject(Router);

    super(router);
  }

  protected async canAccessRoute(
    routeData: DynamicComponentConfig,
  ): Promise<boolean> {
    const permittedRoles = routeData?.permittedUserRoles;
    const user = this.sessionInfo.value;

    if (permittedRoles?.length > 0) {
      // Check if user has a role which is in the list of permitted roles
      return permittedRoles.some((role) => user.roles.includes(role));
    } else {
      // No config set => all users are allowed
      return true;
    }
  }
}
