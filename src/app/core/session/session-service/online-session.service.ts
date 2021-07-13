import { SessionService } from "./session.service";
import { User } from "../../user/user";
import { StateHandler } from "../session-states/state-handler";
import { ConnectionState } from "../session-states/connection-state.enum";
import { LoginState } from "../session-states/login-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import { Database } from "../../database/database";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { RemoteSession } from "./remote-session";
import { PouchDatabase } from "../../database/pouch-database";
import { LoggingService } from "../../logging/logging.service";

/**
 * SessionService implementation for use of the app with direct requests to the remote server
 * avoiding any sync to local data.
 *
 * This can be a useful mode for users to save time (no waiting till initial sync is complete)
 * or when working on a device that the user is not regularly using (e.g. a public computer)
 * where data should not be saved locally for security reasons also.
 *
 * The OnlineSessionService mode is not usable without an internet connection. Offline functionality is not available.
 *
 * TODO: requires a configuration or UI option to select OnlineSession
 *
 * For an CouchDB/PouchDB sync based session implementation that allows offline use see {@link SyncedSessionService}
 */
export class OnlineSessionService extends SessionService {
  private currentUser: User;
  private loginState: StateHandler<LoginState> = new StateHandler<LoginState>(
    LoginState.LOGGED_OUT
  );
  private connectionState: StateHandler<ConnectionState> =
    new StateHandler<ConnectionState>(ConnectionState.DISCONNECTED);
  private syncState: StateHandler<SyncState> = new StateHandler<SyncState>(
    SyncState.UNSYNCED
  );
  private remoteSession: RemoteSession;
  private database: PouchDatabase;

  constructor(
    private loggingService: LoggingService,
    private entitySchemaService: EntitySchemaService
  ) {
    super();
    this.remoteSession = new RemoteSession();
    this.database = new PouchDatabase(
      this.remoteSession.database,
      this.loggingService
    );
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
   * Log in the given user authenticating against the remote server's CouchDB.
   *
   * also see {@link SessionService}
   */
  public async login(username, password): Promise<LoginState> {
    const connectionState: ConnectionState = await this.remoteSession.login(
      username,
      password
    );
    if (connectionState === ConnectionState.CONNECTED) {
      this.currentUser = await this.loadUser(username);

      this.loginState.setState(LoginState.LOGGED_IN);
      this.connectionState.setState(ConnectionState.CONNECTED);
      this.syncState.setState(SyncState.COMPLETED);

      return LoginState.LOGGED_IN;
    }
    return LoginState.LOGIN_FAILED;
  }

  /** see {@link SessionService} */
  public logout(): void {
    this.remoteSession.logout();

    this.loginState.setState(LoginState.LOGGED_OUT);
    this.connectionState.setState(ConnectionState.DISCONNECTED);
  }

  /**
   * Dummy implementation, will directly go to SyncState.COMPLETED
   * OnlineSession does not require any kind of synchronisation.
   */
  public async sync(): Promise<any> {
    this.syncState.setState(SyncState.COMPLETED);
  }

  /**
   * Helper to get a User Entity from the Database without needing the EntityMapperService
   * @param userId Id of the User to be loaded
   */
  private async loadUser(userId: string): Promise<User> {
    const user = new User("");
    const userData = await this.getDatabase().get("User:" + userId);
    this.entitySchemaService.loadDataIntoEntity(user, userData);
    return user;
  }
}
