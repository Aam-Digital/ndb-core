import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate } from "@angular/router";
import { SessionService } from "../session/session-service/session.service";
import { ConfigService } from "../config/config.service";
import { ViewConfig } from "../view/dynamic-routing/view-config.interface";
import { RouterService } from "../view/dynamic-routing/router.service";

@Injectable({
  providedIn: "root",
})
export class UserRoleGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private configService: ConfigService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const config = this.configService.getConfig<ViewConfig>(
      RouterService.PREFIX_VIEW_CONFIG + route.routeConfig.path
    );
    const user = this.sessionService.getCurrentDBUser();
    if (config.permittedUserRoles?.length > 0) {
      // Check if user has a role which is in the list of permitted roles
      return config.permittedUserRoles.some((role) =>
        user.roles.includes(role)
      );
    } else {
      // No config set => all users are allowed
      return true;
    }
  }
}
