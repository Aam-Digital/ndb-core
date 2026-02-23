import { inject, Injectable } from "@angular/core";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { SessionManagerService } from "../session/session-service/session-manager.service";
import { LocalAuthService } from "../session/auth/local/local-auth.service";
import { SessionInfo, SessionSubject } from "../session/auth/session-info";
import { PouchDatabase } from "../database/pouchdb/pouch-database";
import { environment } from "../../../environments/environment";
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject, SessionType } from "../session/session-type";
import memory from "pouchdb-adapter-memory";
import PouchDB from "pouchdb-browser";
import { DatabaseResolverService } from "../database/database-resolver.service";
import { computeDbNames } from "../database/db-name-helpers";

/**
 * This service handles everything related to the demo-mode
 *  - Register users (demo and demo-admin)
 *  - Publish demo data if none is present
 *  - Automatically login user (demo)
 *  - Synchronizes (local) databases of different users in the same browser
 */
@Injectable()
export class DemoDataInitializerService {
  private demoDataService = inject(DemoDataService);
  private localAuthService = inject(LocalAuthService);
  private sessionManager = inject(SessionManagerService);
  private dialog = inject(MatDialog);
  private dbResolver = inject(DatabaseResolverService);
  private loginState = inject(LoginStateSubject);
  private sessionInfo = inject(SessionSubject);

  private liveSyncHandle: PouchDB.Replication.Sync<any>;

  private readonly normalUser: SessionInfo = {
    name: DemoUserGeneratorService.DEFAULT_USERNAME,
    id: DemoUserGeneratorService.DEFAULT_USERNAME,
    roles: ["user_app"],
    entityId: `User:${DemoUserGeneratorService.DEFAULT_USERNAME}`,
  };
  private readonly adminUser: SessionInfo = {
    name: DemoUserGeneratorService.ADMIN_USERNAME,
    id: DemoUserGeneratorService.ADMIN_USERNAME,
    roles: ["user_app", "admin_app"],
    entityId: `User:${DemoUserGeneratorService.ADMIN_USERNAME}`,
  };

  async logInDemoUser() {
    this.localAuthService.saveUser(this.normalUser);
    this.localAuthService.saveUser(this.adminUser);

    await this.sessionManager.offlineLogin(this.adminUser);

    this.syncDatabaseOnUserChange();
  }

  /**
   * Generates additional demo data (regardless of whether the demo data is already present).
   * Make sure a user is logged in before calling this method so that a valid database is available.
   *
   * Alternatively, use `DemoDataInitializerService.run()` to do a complete initialization including user setup.
   */
  async generateDemoData() {
    const dialogRef = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent,
    );

    if (window["e2eDemoData"]) {
      const db = this.dbResolver.getDatabase();
      await db.putAll(window["e2eDemoData"]);
    } else {
      await this.demoDataService.publishDemoData();
    }

    dialogRef.close();
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
    const demoSession = this.normalUser;
    const dbNames = computeDbNames(demoSession);
    const dbName = dbNames.app;
    let demoUserDB: PouchDB.Database;
    if (environment.session_type === SessionType.mock) {
      PouchDB.plugin(memory);
      demoUserDB = new PouchDB(dbName, { adapter: "memory" });
    } else {
      demoUserDB = new PouchDB(
        dbName,
        environment.use_indexeddb_adapter ? { adapter: "indexeddb" } : {},
      );
    }
    const currentUserDB = (
      this.dbResolver.getDatabase() as PouchDatabase
    ).getPouchDB();
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
