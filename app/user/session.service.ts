import { Injectable } from '@angular/core';

import { User } from "./user";
import { DatabaseManagerService } from "../database/database-manager.service";
import { AlertService } from "../alerts/alert.service";
import { Alert } from "../alerts/alert";


@Injectable()
export class SessionService {
    currentUser: User;

    constructor(private _dbManager: DatabaseManagerService,
                private _alertService: AlertService) {

    }


    public isLoggedIn() : boolean {
        return this.currentUser != null;
    }

    public login(username:string, password:string): Promise<boolean> {
        let promise: Promise<boolean>;

        //promise = this.authenticateLocalUser();

        promise = this.remoteDatabaseLogin(username, password);

        return promise;
    }


    private authenticateLocalUser(): Promise<boolean> {
        return new Promise<boolean>();
    }


    private remoteDatabaseLogin(username:string, password:string): Promise<boolean> {
        //TODO: Maybe this should move to a separate service that deals with a progress bar etc.

        let self = this;
        return this._dbManager.login(username, password)
            .then(function(loginSuccess) {
                if(loginSuccess) {
                    self.onRemoteLoginSuccessfull();
                }
                else {
                    self.onRemoteLoginFailed();
                }
                return loginSuccess;
            });
    }

    private onRemoteLoginSuccessfull() {
        this._alertService.addInfo("Connected to remote database.");
    }

    private onRemoteLoginFailed() {
        this._alertService.addWarning("Could not connect to remote database.");
    }



    public logout() {
        this.currentUser = null;
    }
}
