import { SessionService } from './session.service';
import { User } from 'app/user/user';
import { StateHandler } from './util/state-handler';
import { ConnectionState } from './connection-state.enum';
import { LoginState } from './login-state.enum';
import { SyncState } from './sync-state.enum';
import { MockDatabase } from 'app/database/mock-database';
import { Database } from 'app/database/database';
import { DemoData } from 'app/database/demo-data';
import { EntityMapperService } from 'app/entity/entity-mapper.service';

export class MockSessionService extends SessionService {
    private database: MockDatabase;
    private demoUser: User;
    private loginState: StateHandler<LoginState> = new StateHandler<LoginState>(LoginState.loggedOut);
    private connectionState: StateHandler<ConnectionState> = new StateHandler<ConnectionState>(ConnectionState.disconnected);
    private syncState: StateHandler<SyncState> = new StateHandler<SyncState>(SyncState.unsynced);

    constructor() {
        super();
        this.database = new MockDatabase();
        this.initDemoData();
    }

    private initDemoData() {
        const entityMapper = new EntityMapperService(this.database);

        // add demo user
        this.demoUser = new User('demo');
        this.demoUser.name = 'demo';
        this.demoUser.setNewPassword('pass');
        entityMapper.save(this.demoUser);

        DemoData.getAllDemoEntities()
            .forEach(c => entityMapper.save(c));
    };

    public getCurrentUser(): User {
        return this.demoUser;
    }
    public isLoggedIn(): boolean {
        return this.loginState.getState() === LoginState.loggedIn;
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
            this.loginState.setState(LoginState.loggedIn);
            this.connectionState.setState(ConnectionState.connected);
            setTimeout(() => this.sync(), 0);
            return Promise.resolve(LoginState.loggedIn);
        }
        this.loginState.setState(LoginState.loginFailed);
        this.connectionState.setState(ConnectionState.rejected);
        return Promise.resolve(LoginState.loginFailed);
    }
    public logout(): void {
        this.loginState.setState(LoginState.loggedOut);
        this.connectionState.setState(ConnectionState.disconnected);
    }
    public sync(): Promise<any> {
        this.syncState.setState(SyncState.started);
        this.syncState.setState(SyncState.completed);
        return Promise.resolve(true);
    }
}
