import {Injectable, EventEmitter} from '@angular/core';

import {User} from "../user/user";
import {DatabaseManagerService} from "../database/database-manager.service";
import {AlertService} from "../alerts/alert.service";
import {EntityMapperService} from "../entity/entity-mapper.service";
import {SessionStatus} from "./session-status";


@Injectable()
export class SessionService {
    currentUser: User = null;

    constructor(private _dbManager: DatabaseManagerService,
                private _entityMapper: EntityMapperService,
                private _alertService: AlertService) {

    }

    _onSessionStatusChanged: EventEmitter<SessionStatus>;
    get onSessionStatusChanged() {
        if (this._onSessionStatusChanged == null) {
            this._onSessionStatusChanged = new EventEmitter<SessionStatus>(true);
        }
        return this._onSessionStatusChanged;
    }

    public isLoggedIn() : boolean {
        return this.currentUser !== null;
    }

    /**
     * Authenticates the given user with local and remote database.
     * If successful, the user is set as currentUser for this session.
     *
     * WARNING: This method returns false immediately if the user cannot be authenticated with the local database.
     */
    public login(username: string, password: string): Promise<boolean> {
        let promise: Promise<boolean>;

        promise = this.authenticateLocalUser(username, password);

        this.remoteDatabaseLogin(username, password);

        return promise;
    }

    public logout() {
        this.currentUser = null;
        this.onSessionStatusChanged.emit(SessionStatus.loggedOut);
    }


    private authenticateLocalUser(username: string, password: string): Promise<boolean> {
        let self = this;
        return this._entityMapper.load<User>(new User(username))
            .then(function (userEntity) {
                if (userEntity.checkPassword(password)) {
                    self.onLocalLoginSuccessful(userEntity);
                    return true;
                } else {
                    self.onLocalLoginFailed({status: 401});
                    return false;
                }
            })
            .catch(function(error: any) {
                self.onLocalLoginFailed(error);
                return false;
            });
    }

    private onLocalLoginSuccessful(user: User) {
        this.currentUser = user;
        this.onSessionStatusChanged.emit(SessionStatus.loggedIn);
    }

    private onLocalLoginFailed(error: any) {
        this.currentUser = null;
        this.onSessionStatusChanged.emit(SessionStatus.loginFailed);
        return error;
    }


    private remoteDatabaseLogin(username: string, password: string): Promise<boolean> {
        let self = this;
        return this._dbManager.login(username, password)
            .then(function (loginSuccess) {
                if (loginSuccess) {
                    self.onRemoteLoginSuccessful();
                }
                else {
                    self.onRemoteLoginFailed();
                }
                return loginSuccess;
            });
    }

    private onRemoteLoginSuccessful() {
        this._alertService.addInfo("Connected to remote database.");
    }

    private onRemoteLoginFailed() {
        this._alertService.addWarning('Could not connect to remote database. Data cannot be synchronized at the moment.');
    }
}
