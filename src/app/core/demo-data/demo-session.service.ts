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
import { DatabaseUser, LocalUser } from "../session/session-service/local-user";
import { SyncState } from "../session/session-states/sync-state.enum";

@Injectable()
export class DemoSession extends SessionService {
  private localSession: LocalSession;
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
    const newUserPouch = this.getDatabase().getPouchDB();
    const newUserDBInfo = await newUserPouch.info();
    const existingDatabase = await this.findExistingDBWithMostDocs(
      newUserDBInfo.doc_count
    );
    if (existingDatabase) {
      await newUserPouch.sync(existingDatabase, { batch_size: 500 });
      newUserPouch.sync(existingDatabase, {
        live: true,
        retry: true,
      });
    } else {
      await this.demoDataService.publishDemoData();
    }
    this.syncState.next(SyncState.COMPLETED);
  }

  private async findExistingDBWithMostDocs(
    currentDBDocs: number
  ): Promise<PouchDB.Database> {
    let foundDatabase: PouchDB.Database;
    let maxDocs = currentDBDocs;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        this.getCurrentUser().name !== key &&
        this.isLocalUser(window.localStorage.getItem(key))
      ) {
        const db = this.createPouchDBForUser(key);
        const info = await db.info();
        if (info.doc_count > maxDocs) {
          foundDatabase = db;
          maxDocs = info.doc_count;
        }
      }
    }
    return foundDatabase;
  }

  private isLocalUser(value: string): boolean {
    try {
      const obj: LocalUser = JSON.parse(value);
      return !!(obj && obj.name && obj.encryptedPassword && obj.roles);
    } catch (e) {
      return false;
    }
  }

  private createPouchDBForUser(username: string): PouchDB.Database {
    const dbName = `${username}-${AppConfig.settings.database.name}`;
    if (AppConfig.settings.session_type === SessionType.mock) {
      PouchDB.plugin(memory);
      return new PouchDB(dbName, { adapter: "memory" });
    } else {
      return new PouchDB(dbName);
    }
  }
}
