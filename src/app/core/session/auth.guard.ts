import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { LoginStateSubject } from "./session-type";
import { LoginState } from "./session-states/login-state.enum";

export const AuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  if (inject(LoginStateSubject).value === LoginState.LOGGED_IN) {
    return true;
  } else {
    // todo remove tpa_parameter from redirect_uri
    return inject(Router).createUrlTree(["/login"], {
      queryParams: {
        redirect_uri: state.url,
      },
    });
  }
};
