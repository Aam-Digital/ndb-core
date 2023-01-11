import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { SessionService } from "./session-service/session.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(private session: SessionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.session.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(["/login"], {
        queryParams: {
          redirect_uri: state.url,
        },
      });
      return false;
    }
  }
}
