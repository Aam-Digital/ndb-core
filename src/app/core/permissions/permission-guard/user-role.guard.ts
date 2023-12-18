import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { CurrentUserSubject } from "../../user/user";
import { AbstractPermissionGuard } from "./abstract-permission.guard";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

/**
 * A guard that checks the roles of the current user against the permissions which are saved in the route data.
 */
@Injectable()
export class UserRoleGuard extends AbstractPermissionGuard {
  constructor(
    router: Router,
    private currentUser: CurrentUserSubject,
  ) {
    super(router);
  }

  protected async canAccessRoute(
    routeData: DynamicComponentConfig
  ): Promise<boolean> {
    const permittedRoles = routeData?.permittedUserRoles;
    const user = this.currentUser.value;

    if (permittedRoles?.length > 0) {
      // Check if user has a role which is in the list of permitted roles
      return permittedRoles.some((role) => user.roles.includes(role));
    } else {
      // No config set => all users are allowed
      return true;
    }
  }
}
