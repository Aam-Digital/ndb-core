import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { SessionService } from "./session-service/session.service";

export const AuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  if (inject(SessionService).isLoggedIn()) {
    return true;
  } else {
    return inject(Router).createUrlTree(["/login"], {
      queryParams: {
        redirect_uri: state.url,
      },
    });
  }
};
