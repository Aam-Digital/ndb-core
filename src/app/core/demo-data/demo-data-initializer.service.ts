import { Injectable } from "@angular/core";
import { DemoDataService } from "./demo-data.service";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { LocalSession } from "../session/session-service/local-session";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { LoggingService } from "../logging/logging.service";
import { AppConfig } from "../app-config/app-config";
import { LoginState } from "../session/session-states/login-state.enum";
import PouchDB from "pouchdb-browser";
import { SessionType } from "../session/session-type";
import memory from "pouchdb-adapter-memory";
import { Database } from "../database/database";
import { PouchDatabase } from "../database/pouch-database";

@Injectable()
export class DemoDataInitializerService {
  private liveSyncHandle: PouchDB.Replication.Sync<any>;
  private pouchDatabase: PouchDatabase;

  constructor(
    private demoDataService: DemoDataService,
    private sessionService: SessionService,
    private dialog: MatDialog,
    private loggingService: LoggingService,
    database: Database
  ) {
    if (database instanceof PouchDatabase) {
      this.pouchDatabase = database;
    } else {
      this.loggingService.warn(
        "Cannot create demo data with session: " +
          AppConfig.settings.session_type
      );
    }
    this.registerDemoUsers();
    this.sessionService.loginState.subscribe((state) => {
      if (
        state === LoginState.LOGGED_IN &&
        this.sessionService.getCurrentUser().name !==
          DemoUserGeneratorService.DEFAULT_USERNAME
      ) {
        this.syncWithDemoUserDB();
      } else if (state === LoginState.LOGGED_OUT) {
        this.stopLiveSync();
      }
    });
  }

  private registerDemoUsers() {
    const localSession = this.sessionService as LocalSession;
    localSession.saveUser(
      {
        name: DemoUserGeneratorService.DEFAULT_USERNAME,
        roles: ["user_app"],
      },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    localSession.saveUser(
      {
        name: DemoUserGeneratorService.ADMIN_USERNAME,
        roles: ["user_app", "admin_app"],
      },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }

  private async syncWithDemoUserDB() {
    const dbName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${AppConfig.settings.database.name}`;
    let demoUserDB: PouchDB.Database;
    if (AppConfig.settings.session_type === SessionType.mock) {
      PouchDB.plugin(memory);
      demoUserDB = new PouchDB(dbName, { adapter: "memory" });
    } else {
      demoUserDB = new PouchDB(dbName);
    }
    const currentUserDB = this.pouchDatabase.getPouchDB();
    await currentUserDB.sync(demoUserDB, { batch_size: 500 });
    this.liveSyncHandle = currentUserDB.sync(demoUserDB, {
      live: true,
      retry: true,
    });
  }

  private stopLiveSync() {
    if (this.liveSyncHandle) {
      this.liveSyncHandle.cancel();
      this.liveSyncHandle = undefined;
    }
  }

  async run() {
    const dialogRef = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent
    );

    this.initializeDefaultDatabase();
    await this.demoDataService.publishDemoData();

    dialogRef.close();

    await this.sessionService.login(
      DemoUserGeneratorService.DEFAULT_USERNAME,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }

  private initializeDefaultDatabase() {
    const dbName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${AppConfig.settings.database.name}`;
    if (AppConfig.settings.session_type === SessionType.mock) {
      this.pouchDatabase.initInMemoryDB(dbName);
    } else {
      this.pouchDatabase.initIndexedDB(dbName);
    }
  }
}
