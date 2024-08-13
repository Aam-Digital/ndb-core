import { Injectable } from "@angular/core";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { SessionManagerService } from "../session/session-service/session-manager.service";
import { LocalAuthService } from "../session/auth/local/local-auth.service";
import { SessionInfo, SessionSubject } from "../session/auth/session-info";
import { Logging } from "../logging/logging.service";
import { Database } from "../database/database";
import { PouchDatabase } from "../database/pouch-database";
import { environment } from "../../../environments/environment";
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject, SessionType } from "../session/session-type";
import memory from "pouchdb-adapter-memory";
import PouchDB from "pouchdb-browser";

/**
 * This service handles everything related to the demo-mode
 *  - Register users (demo and demo-admin)
 *  - Publish demo data if none is present
 *  - Automatically login user (demo)
 *  - Synchronizes (local) databases of different users in the same browser
 */
@Injectable()
export class DemoDataInitializerService {
  private liveSyncHandle: PouchDB.Replication.Sync<any>;
  private pouchDatabase: PouchDatabase;
  private readonly normalUser: SessionInfo = {
    name: DemoUserGeneratorService.DEFAULT_USERNAME,
    roles: ["user_app"],
    entityId: `User:${DemoUserGeneratorService.DEFAULT_USERNAME}`,
  };
  private readonly adminUser: SessionInfo = {
    name: DemoUserGeneratorService.ADMIN_USERNAME,
    roles: ["user_app", "admin_app"],
    entityId: `User:${DemoUserGeneratorService.ADMIN_USERNAME}`,
  };
  constructor(
    private demoDataService: DemoDataService,
    private localAuthService: LocalAuthService,
    private sessionManager: SessionManagerService,
    private dialog: MatDialog,
    private database: Database,
    private loginState: LoginStateSubject,
    private sessionInfo: SessionSubject,
  ) {}

  async run() {
    const dialogRef = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent,
    );
    if (this.database instanceof PouchDatabase) {
      this.pouchDatabase = this.database;
    } else {
      Logging.warn(
        "Cannot create demo data with session: " + environment.session_type,
      );
    }

    this.localAuthService.saveUser(this.normalUser);
    this.localAuthService.saveUser(this.adminUser);
    await this.sessionManager.offlineLogin(this.normalUser);
    await this.demoDataService.publishDemoData();

    dialogRef.close();
    this.syncDatabaseOnUserChange();
  }

  private syncDatabaseOnUserChange() {
    this.loginState.subscribe((state) => {
      if (
        state === LoginState.LOGGED_IN &&
        this.sessionInfo.value.name !==
          DemoUserGeneratorService.DEFAULT_USERNAME
      ) {
        // There is a slight race-condition with session type local
        // It throws an error because it can't find the view-documents which are not yet synced
        // Navigating in the app solves this problem
        this.syncWithDemoUserDB();
      } else if (state === LoginState.LOGGED_OUT) {
        this.stopLiveSync();
      }
    });
  }

  private async syncWithDemoUserDB() {
    const dbName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${environment.DB_NAME}`;
    let demoUserDB: PouchDB.Database;
    if (environment.session_type === SessionType.mock) {
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
}
