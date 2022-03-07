import { Injectable } from "@angular/core";
import { DemoDataService } from "./demo-data.service";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { LocalSession } from "../session/session-service/local-session";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";

@Injectable()
export class DemoDataInitializerService {
  constructor(
    private demoDataService: DemoDataService,
    private sessionService: SessionService,
    private dialog: MatDialog
  ) {
    if (this.sessionService instanceof SessionService) {
      this.registerDemoUsers(this.sessionService as LocalSession);
    }
  }

  async run() {
    const dialogRef = this.dialog.open(
      DemoDataGeneratingProgressDialogComponent
    );
    await this.demoDataService.publishDemoData();
    dialogRef.close();

    await this.sessionService.login(
      DemoUserGeneratorService.DEFAULT_USERNAME,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }

  private registerDemoUsers(localSession: LocalSession) {
    localSession.saveUser(
      { name: DemoUserGeneratorService.DEFAULT_USERNAME, roles: ["user_app"] },
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
}
