import { Injectable } from "@angular/core";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { SessionManagerService } from "../session/session-service/session-manager.service";
import { LocalAuthService } from "../session/auth/local/local-auth.service";

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
    private localAuthService: LocalAuthService,
    private sessionManager: SessionManagerService,
    private dialog: MatDialog,
  ) {}

  async run() {
    const dialogRef = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent,
    );

    this.registerDemoUsers();
    await this.sessionManager.offlineLogin();
    await this.demoDataService.publishDemoData();

    dialogRef.close();
  }

  private registerDemoUsers() {
    this.localAuthService.saveUser({
      name: DemoUserGeneratorService.DEFAULT_USERNAME,
      roles: ["user_app"],
    });
  }
}
