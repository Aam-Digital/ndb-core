import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SessionService } from './session.service';

@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private _sessionService: SessionService) {
  }

  canActivate() {
    return this._sessionService.isLoggedIn();
  }

  /* TODO: needed for new router?
   canActivate(
   next: ActivatedRouteSnapshot,
   state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
   return true;
   } */
}
