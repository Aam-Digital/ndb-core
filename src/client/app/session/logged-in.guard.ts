import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { SessionService } from './session.service';

@Injectable()
export class LoggedInGuard implements CanActivate {
    constructor(private _sessionService:SessionService) {
    }

    canActivate() {
        return this._sessionService.isLoggedIn();
    }
}
