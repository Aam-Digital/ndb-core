import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

import {AppComponent} from './app.component';
import { routing } from "./app.routing";
import {AlertsModule} from "./alerts/alerts.module";
import {NG2BootstrapModule} from "./ng2-bootstrap.module";
import {DatabaseModule} from "./database/database.module";
import {ConfigModule} from "./config/config.module";
import {SessionModule} from "./session/session.module";
import {SyncStatusModule} from "./sync-status/sync-status.module";
import {DashboardModule} from "./dashboard/dashboard.module";
import {NavigationModule} from "./navigation/navigation.module";
import {UIModule} from "./ui/ui.module";

@NgModule({
    imports: [
        BrowserModule,
        routing,
        FormsModule,
        AlertsModule,
        NG2BootstrapModule,
        DatabaseModule,
        ConfigModule,
        SessionModule,
        SyncStatusModule,
        DashboardModule,
        NavigationModule,
        UIModule
        // UserModule is lazy loaded
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
}
