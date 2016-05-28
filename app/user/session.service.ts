import { Injectable } from '@angular/core';

import { User } from "./user";
import { DatabaseManagerService } from "../database/database-manager.service";
import { AlertService } from "../alerts/alert.service";
import { EntityMapperService } from "../database/entity-mapper.service";
import { Alert } from "../alerts/alert";


@Injectable()
export class SessionService {
    currentUser: User;

    constructor(private _dbManager: DatabaseManagerService,
                private _entityMapper: EntityMapperService,
                private _alertService: AlertService) {

    }


    public isLoggedIn() : boolean {
        return this.currentUser != null;
    }

    public login(username:string, password:string): Promise<boolean> {
        let promise: Promise<boolean>;

        promise = this.authenticateLocalUser(username, password);
        this.remoteDatabaseLogin(username, password);

        return promise;
    }


    private authenticateLocalUser(username: string, password: string): Promise<boolean> {
        let self = this;
        return this._entityMapper.load<User>(username, new User())
            .then(function(userEntity) {
                if(userEntity.checkPassword(password)) {
                    self.onLocalLoginSuccessfull(userEntity);
                    return true;
                } else {
                    self.onLocalLoginFailed({status: 401});
                    return false;
                }
            })
            .catch(function(error) {
                self.onLocalLoginFailed(error);
                return false;
            });
    }

    private onLocalLoginSuccessfull(user: User) {
        this.currentUser = user;
    }

    private onLocalLoginFailed(error) {
        return error;
    }


    private remoteDatabaseLogin(username:string, password:string): Promise<boolean> {

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
