import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable } from "rxjs";
import { SessionService } from "../session/session-service/session.service";

/**
 * Guard checking for the currently logged in user's admin permissions.
 */
@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  constructor(private _sessionService: SessionService) {}

  /**
   * Whether the currently logged in user (if any) has administrative rights.
   */
  public isAdmin(): boolean {
    if (this._sessionService.isLoggedIn()) {
      return this._sessionService.getCurrentUser().isAdmin();
    }
  }

  /**
   * Allows activation (i.e. returns true) only if a user with admin rights is currently logged in.
   * (used by Angular Routing system when added to certain routes)
   *
   * @param next The next route navigated to if allowed (provided by Angular Routing)
   * @param state The current state (provided by Angular Routing)
   */
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.isAdmin();
  }
}
