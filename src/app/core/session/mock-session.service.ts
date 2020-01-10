import { SessionService } from './session.service';
import { User } from 'app/core/user/user';
import { StateHandler } from './util/state-handler';
import { ConnectionState } from './connection-state.enum';
import { LoginState } from './login-state.enum';
import { SyncState } from './sync-state.enum';
import { MockDatabase } from 'app/core/database/mock-database';
import { Database } from 'app/core/database/database';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';

export class MockSessionService extends SessionService {
    private database: MockDatabase;
    private currentUser: User;
    private loginState: StateHandler<LoginState> = new StateHandler<LoginState>(LoginState.LOGGED_OUT);
    private connectionState: StateHandler<ConnectionState> = new StateHandler<ConnectionState>(ConnectionState.DISCONNECTED);
    private syncState: StateHandler<SyncState> = new StateHandler<SyncState>(SyncState.UNSYNCED);

    constructor(private _entitySchemaService: EntitySchemaService) {
        super();
        this.database = new MockDatabase();
    }

    public getCurrentUser(): User {
        return this.currentUser;
    }
    public isLoggedIn(): boolean {
        return this.loginState.getState() === LoginState.LOGGED_IN;
    }
    public getConnectionState(): StateHandler<ConnectionState> {
        return this.connectionState;
    }
    public getLoginState(): StateHandler<LoginState> {
        return this.loginState;
    }
    public getSyncState(): StateHandler<SyncState> {
        return this.syncState;
    }
    public getDatabase(): Database {
        return this.database;
    }
    public async login(username, password): Promise<LoginState> {
        try {
            const userEntity = await this.loadUser(username);
            if (userEntity.checkPassword(password)) {
              this.loginState.setState(LoginState.LOGGED_IN);
              this.connectionState.setState(ConnectionState.CONNECTED);
              this.currentUser = userEntity;
                setTimeout(() => this.sync(), 0);
                return LoginState.LOGGED_IN;
            } else {
              this.loginState.setState(LoginState.LOGIN_FAILED);
              this.connectionState.setState(ConnectionState.REJECTED);
              return LoginState.LOGIN_FAILED;
            }
        } catch (error) {
            // possible error: user object not found locally, which should return loginFailed.
            if (error && error.status && error.status === 404) {
                this.loginState.setState(LoginState.LOGIN_FAILED);
                this.connectionState.setState(ConnectionState.REJECTED);
                return LoginState.LOGIN_FAILED;
            }
            // all other cases must throw an error
            throw error;
        }
    }
    public logout(): void {
        this.loginState.setState(LoginState.LOGGED_OUT);
        this.connectionState.setState(ConnectionState.DISCONNECTED);
    }
    public sync(): Promise<any> {
        this.syncState.setState(SyncState.STARTED);
        return new Promise(resolve => setTimeout(() => {
            this.syncState.setState(SyncState.COMPLETED);
            resolve();
        }, 0));
    }

    /**
     * Helper to get a User Entity from the Database without needing the EntityMapperService
     * @param userId Id of the User to be loaded
     */
    public async loadUser(userId: string): Promise<User> {
        const user = new User('');
        const userData = await this.database.get('User:' + userId);
        this._entitySchemaService.loadDataIntoEntity(user, userData);
        return user;
    }
}
