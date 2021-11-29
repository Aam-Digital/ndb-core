import { Injectable } from "@angular/core";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { LocalSession } from "../session/session-service/local-session";
import { PouchDatabase } from "../database/pouch-database";
import { DemoDataService } from "./demo-data.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "../session/session-type";
import PouchDB from "pouchdb-browser";
import memory from "pouchdb-adapter-memory";
import { DatabaseUser } from "../session/session-service/local-user";
import { SyncState } from "../session/session-states/sync-state.enum";

@Injectable()
export class DemoSession extends SessionService {
  private localSession: LocalSession;
  private liveSyncHandle: PouchDB.Replication.Sync<any>;

  constructor(
    database: PouchDatabase,
    private demoDataService: DemoDataService
  ) {
    super();
    this.localSession = new LocalSession(database);
    this.registerDemoUsers();
    this.login(
      DemoUserGeneratorService.DEFAULT_USERNAME,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }

  checkPassword(username: string, password: string): boolean {
    return this.localSession.checkPassword(username, password);
  }

  getCurrentUser(): DatabaseUser {
    return this.localSession.getCurrentUser();
  }

  getDatabase(): PouchDatabase {
    return this.localSession.getDatabase();
  }

  async login(username: string, password: string): Promise<LoginState> {
    const state = await this.localSession.login(username, password);
    await this.initUserDemoData();
    this.loginState.next(state);
    return state;
  }

  logout() {
    this.localSession.logout();
    this.liveSyncHandle.cancel();
    this.loginState.next(LoginState.LOGGED_OUT);
    this.syncState.next(SyncState.UNSYNCED);
  }

  sync(): Promise<any> {
    return Promise.reject(undefined);
  }

  private registerDemoUsers() {
    this.localSession.saveUser(
      { name: DemoUserGeneratorService.DEFAULT_USERNAME, roles: ["user_app"] },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    this.localSession.saveUser(
      {
        name: DemoUserGeneratorService.ADMIN_USERNAME,
        roles: ["user_app", "admin_app"],
      },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }

  private async initUserDemoData() {
    this.syncState.next(SyncState.STARTED);
    const currentUser = this.getCurrentUser();
    const demoUserName = DemoUserGeneratorService.DEFAULT_USERNAME;
    if (currentUser.name === demoUserName) {
      await this.demoDataService.publishDemoData();
    } else {
      await this.syncWithDemoUserDB(demoUserName);
    }
    this.syncState.next(SyncState.COMPLETED);
  }

  private async syncWithDemoUserDB(demoUserName: string) {
    const dbName = `${demoUserName}-${AppConfig.settings.database.name}`;
    let demoUserDB: PouchDB.Database;
    if (AppConfig.settings.session_type === SessionType.mock) {
      PouchDB.plugin(memory);
      demoUserDB = new PouchDB(dbName, { adapter: "memory" });
    } else {
      demoUserDB = new PouchDB(dbName);
    }
    const currentUserDB = this.getDatabase().getPouchDB();
    await currentUserDB.sync(demoUserDB, { batch_size: 500 });
    this.liveSyncHandle = currentUserDB.sync(demoUserDB, {
      live: true,
      retry: true,
    });
  }
}
