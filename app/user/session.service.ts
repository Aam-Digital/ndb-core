import { Injectable } from 'angular2/core';

import { User } from "./user";
import { DatabaseManagerService } from "../database/database-manager.service";


@Injectable()
export class SessionService {
    currentUser: User;

    constructor(private _dbManager: DatabaseManagerService) {

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
        console.info("remote login successfull");
    }

    private onRemoteLoginFailed() {
        console.warn("remote login failed");
    }



    public logout() {
        this.currentUser = null;
    }
}
