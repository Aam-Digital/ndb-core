import { SessionService } from './session.service';
import { User } from 'app/user/user';
import { StateHandler } from './util/state-handler';
import { ConnectionState } from './connection-state.enum';
import { LoginState } from './login-state.enum';
import { SyncState } from './sync-state.enum';
import { MockDatabase } from 'app/database/mock-database';
import { Database } from 'app/database/database';
import { EntityMapperService } from 'app/entity/entity-mapper.service';
import { EntitySchemaService } from 'app/entity/schema/entity-schema.service';

export class MockSessionService extends SessionService {
    private database: MockDatabase;
    private demoUser: User;
    private loginState: StateHandler<LoginState> = new StateHandler<LoginState>(LoginState.LOGGED_OUT);
    private connectionState: StateHandler<ConnectionState> = new StateHandler<ConnectionState>(ConnectionState.DISCONNECTED);
    private syncState: StateHandler<SyncState> = new StateHandler<SyncState>(SyncState.UNSYNCED);

    constructor(private _entitySchemaService: EntitySchemaService) {
        super();
        this.database = new MockDatabase();
        this.createDemoUser();
    }

    private createDemoUser() {
        const entityMapper = new EntityMapperService(this.database, this._entitySchemaService);

        // add demo user
        this.demoUser = new User('demo');
        this.demoUser.name = 'demo';
        this.demoUser.setNewPassword('pass');
        entityMapper.save(this.demoUser);
    }

    public getCurrentUser(): User {
        return this.demoUser;
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
    public login(username, password): Promise<LoginState> {
        if (username === 'demo' && password === 'pass') {
            this.loginState.setState(LoginState.LOGGED_IN);
            this.connectionState.setState(ConnectionState.CONNECTED);
            setTimeout(() => this.sync(), 0);
            return Promise.resolve(LoginState.LOGGED_IN);
        }
        this.loginState.setState(LoginState.LOGIN_FAILED);
        this.connectionState.setState(ConnectionState.REJECTED);
        return Promise.resolve(LoginState.LOGIN_FAILED);
    }
    public logout(): void {
        this.loginState.setState(LoginState.LOGGED_OUT);
        this.connectionState.setState(ConnectionState.DISCONNECTED);
    }
    public sync(): Promise<any> {
        this.syncState.setState(SyncState.STARTED);
        this.syncState.setState(SyncState.COMPLETED);
        return Promise.resolve(true);
    }
}
