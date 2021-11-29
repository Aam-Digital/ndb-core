import { Injectable } from "@angular/core";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { LocalSession } from "../session/session-service/local-session";
import { PouchDatabase } from "../database/pouch-database";
import { DemoDataService } from "./demo-data.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { LoginState } from "../session/session-states/login-state.enum";
import { filter } from "rxjs/operators";
import { Database } from "../database/database";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "../session/session-type";
import PouchDB from "pouchdb-browser";
import memory from "pouchdb-adapter-memory";
import { DatabaseUser, LocalUser } from "../session/session-service/local-user";
import { SyncState } from "../session/session-states/sync-state.enum";

@Injectable()
export class DemoSession extends SessionService{
  constructor(
    private sessionService: SessionService,
    private demoDataService: DemoDataService,
    private dialog: MatDialog,
    private database: Database
  ) {
    super();
  }

  checkPassword(username: string, password: string): boolean {
    return false;
  }

  getCurrentUser(): DatabaseUser {
    return undefined;
  }

  getDatabase(): Database {
    return undefined;
  }

  login(username: string, password: string): Promise<LoginState> {
    return Promise.resolve(undefined);
  }

  logout() {
  }

  sync(): Promise<any> {
    return Promise.resolve(undefined);
  }


  async start() {
    this.sessionService.syncState.next(SyncState.STARTED);
    const progressDialog = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent
    );
    progressDialog.disableClose = true;

    this.registerDemoUsers();
    await this.sessionService.login(
      DemoUserGeneratorService.DEFAULT_USERNAME,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    await this.demoDataService.publishDemoData();
    progressDialog.close();
    this.sessionService.syncState.next(SyncState.COMPLETED);

    this.sessionService.loginState
      .pipe(filter((state) => state === LoginState.LOGGED_IN))
      .subscribe(() => this.initNewUserData());
  }

  private registerDemoUsers() {
    // Create temporary session to save users to local storage
    const tmpLocalSession = new LocalSession(new PouchDatabase());
    tmpLocalSession.saveUser(
      { name: DemoUserGeneratorService.DEFAULT_USERNAME, roles: ["user_app"] },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    tmpLocalSession.saveUser(
      {
        name: DemoUserGeneratorService.ADMIN_USERNAME,
        roles: ["user_app", "admin_app"],
      },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }

  private async initNewUserData() {
    const pouchDatabase = this.database as PouchDatabase;
    const newUserPouch = pouchDatabase.getPouchDB();
    const newUserDBInfo = await newUserPouch.info();
    const existingDatabase = await this.findExistingDBWithMostDocs(
      newUserDBInfo.doc_count
    );
    if (existingDatabase) {
      this.sessionService.syncState.next(SyncState.STARTED);
      await newUserPouch.sync(existingDatabase, { batch_size: 500 });
      this.sessionService.syncState.next(SyncState.COMPLETED);
      newUserPouch.sync(existingDatabase, {
        live: true,
        retry: true,
      });
    }
  }

  private async findExistingDBWithMostDocs(
    currentDBDocs: number
  ): Promise<PouchDB.Database> {
    let foundDatabase: PouchDB.Database;
    let maxDocs = currentDBDocs;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        this.sessionService.getCurrentUser().name !== key &&
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
