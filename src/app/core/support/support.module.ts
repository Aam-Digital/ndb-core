import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SupportComponent } from "./support/support.component";
import { MatButtonModule } from "@angular/material/button";
import { SessionService } from "../session/session-service/session.service";
import { filter } from "rxjs/operators";
import { SyncState } from "../session/session-states/sync-state.enum";
import { ConfirmationDialogModule } from "../confirmation-dialog/confirmation-dialog.module";
import { FlexModule } from "@angular/flex-layout";
import { MatExpansionModule } from "@angular/material/expansion";

@NgModule({
  declarations: [SupportComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    ConfirmationDialogModule,
    FlexModule,
    MatExpansionModule,
  ],
  exports: [SupportComponent],
})
export class SupportModule {
  static dynamicComponents = [SupportComponent];
  constructor(sessionService: SessionService) {
    sessionService.syncState
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() =>
        localStorage.setItem(
          SupportComponent.LAST_SYNC_KEY,
          new Date().toISOString()
        )
      );
  }
}
