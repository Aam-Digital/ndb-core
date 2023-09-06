import { Injectable } from "@angular/core";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { SyncedSessionService } from "../session/session-service/synced-session.service";
import { LocalSession } from "../session/session-service/local-session";

/**
 * This service handles everything related to the demo-mode
 *  - Register users (demo and demo-admin)
 *  - Publish demo data if none is present
 *  - Automatically login user (demo)
 *  - Synchronizes (local) databases of different users in the same browser
 */
@Injectable()
export class DemoDataInitializerService {
  constructor(
    private demoDataService: DemoDataService,
    private localSession: LocalSession,
    private syncedSession: SyncedSessionService,
    private dialog: MatDialog,
  ) {}

  async run() {
    const dialogRef = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent,
    );

    this.registerDemoUsers();
    await this.syncedSession.offlineLogin();
    await this.demoDataService.publishDemoData();

    dialogRef.close();
  }

  private registerDemoUsers() {
    this.localSession.saveUser({
      name: DemoUserGeneratorService.DEFAULT_USERNAME,
      roles: ["user_app"],
    });
  }
}
