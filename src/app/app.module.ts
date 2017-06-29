import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { UiModule } from './ui/ui.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { routing } from './app.routing';
import { AlertsModule } from './alerts/alerts.module';
import { SessionModule } from './session/session.module';
import { SyncStatusModule } from './sync-status/sync-status.module';
import { NavigationModule } from './navigation/navigation.module';
import { LatestChangesModule } from './latest-changes/latest-changes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChildrenModule } from './children/children.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    routing,
    FormsModule,
    AlertsModule,
    DatabaseModule,
    ConfigModule,
    SessionModule,
    SyncStatusModule,
    DashboardModule,
    NavigationModule,
    UiModule,
    LatestChangesModule,
    ChildrenModule
    // UserModule is lazy loaded
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
