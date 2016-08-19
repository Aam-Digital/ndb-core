import { Injectable } from '@angular/core';

import { User } from "../user/user";
import { DatabaseManagerService } from "../database/database-manager.service";
import { AlertService } from "../alerts/alert.service";
import { EntityMapperService } from "../model/entity-mapper.service";


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

    /**
     * Authenticates the given user with local and remote database.
     * If successful, the user is set as currentUser for this session.
     *
     * WARNING: This method returns false immediately if the user cannot be authenticated with the local database.
     */
    public login(username:string, password:string): Promise<boolean> {
        let promise: Promise<boolean>;

        promise = this.authenticateLocalUser(username, password);

        this.remoteDatabaseLogin(username, password);

        return promise;
    }


    private authenticateLocalUser(username: string, password: string): Promise<boolean> {
        let self = this;
        return this._entityMapper.load<User>(new User(username))
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
        this.currentUser = null;
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
        this._alertService.addWarning("Could not connect to remote database. Data cannot be synchronized at the moment.");
    }



    public logout() {
        this.currentUser = null;
    }
}
