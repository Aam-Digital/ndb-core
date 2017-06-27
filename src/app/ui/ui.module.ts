import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertsModule } from '../alerts/alerts.module';
import { UiComponent } from './ui/ui.component';
import { FooterComponent } from './footer/footer.component';
import { NavigationModule } from '../navigation/navigation.module';
import { SessionModule } from '../session/session.module';
import { SyncStatusModule } from '../sync-status/sync-status.module';
import { RouterModule } from '@angular/router';
import { LatestChangesModule } from '../latest-changes/latest-changes.module';

@NgModule({
  imports: [
    CommonModule,
    AlertsModule,
    LatestChangesModule,
    NavigationModule,
    RouterModule,
    SessionModule,
    SyncStatusModule
  ],
  declarations: [UiComponent, FooterComponent],
  exports: [UiComponent]
})
export class UiModule {
}
