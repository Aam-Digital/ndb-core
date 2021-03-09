import { SessionService } from "./session.service";
import { StateHandler } from "../session-states/state-handler";
import { ConnectionState } from "../session-states/connection-state.enum";
import { LoginState } from "../session-states/login-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import { MockDatabase } from "../../database/mock-database";
import { User } from "../../user/user";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Database } from "../../database/database";
import { Injectable } from "@angular/core";

/**
 * SessionService implementation for testing and demo purposes.
 * The MockSessionService does not set up a remote connection or sync and only creates an in-memory database,
 * which will lose any changes after closing the browser.
 *
 * Set `"database": { "useTemporaryDatabase": true }` in your app-config.json
 * to use the MockSessionService which will also generate demo data.
 *
 * For an CouchDB/PouchDB sync based session implementation see {@link SyncedSessionService}
 */
@Injectable()
export class MockSessionService extends SessionService {
  private database: MockDatabase;
  private currentUser: User;
  private loginState: StateHandler<LoginState> = new StateHandler<LoginState>(
    LoginState.LOGGED_OUT
  );
  private connectionState: StateHandler<ConnectionState> = new StateHandler<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  private syncState: StateHandler<SyncState> = new StateHandler<SyncState>(
    SyncState.UNSYNCED
  );

  constructor(private _entitySchemaService: EntitySchemaService) {
    super();
    this.database = new MockDatabase();
  }

  /** see {@link SessionService} */
  public getCurrentUser(): User {
    return this.currentUser;
  }

  /** see {@link SessionService} */
  public isLoggedIn(): boolean {
    return this.loginState.getState() === LoginState.LOGGED_IN;
  }
  /** see {@link SessionService} */
  public getConnectionState(): StateHandler<ConnectionState> {
    return this.connectionState;
  }
  /** see {@link SessionService} */
  public getLoginState(): StateHandler<LoginState> {
    return this.loginState;
  }
  /** see {@link SessionService} */
  public getSyncState(): StateHandler<SyncState> {
    return this.syncState;
  }
  /** see {@link SessionService} */
  public getDatabase(): Database {
    return this.database;
  }

  /**
   * Log in the given user.
   * Checks the in-memory database for User Entities to authenticate against.
   *
   * also see {@link SessionService}
   */
  public async login(username, password): Promise<LoginState> {
    try {
      const userEntity = await this.loadUser(username);
      if (userEntity.checkPassword(password)) {
        this.currentUser = userEntity;
        this.currentUser.decryptCloudPassword(password);
        this.loginState.setState(LoginState.LOGGED_IN);
        this.connectionState.setState(ConnectionState.CONNECTED);
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
  /** see {@link SessionService} */
  public logout(): void {
    this.loginState.setState(LoginState.LOGGED_OUT);
    this.connectionState.setState(ConnectionState.DISCONNECTED);
  }

  /**
   * Dummy implementation, will trigger syncState to quickly switch to SyncState.COMPLETED.
   */
  public sync(): Promise<void> {
    this.syncState.setState(SyncState.STARTED);
    return new Promise((resolve) =>
      setTimeout(() => {
        this.syncState.setState(SyncState.COMPLETED);
        resolve();
      }, 0)
    );
  }

  /**
   * Helper to get a User Entity from the Database without needing the EntityMapperService
   * @param userId Id of the User to be loaded
   */
  public async loadUser(userId: string): Promise<User> {
    const user = new User("");
    const userData = await this.database.get("User:" + userId);
    this._entitySchemaService.loadDataIntoEntity(user, userData);
    return user;
  }
}
