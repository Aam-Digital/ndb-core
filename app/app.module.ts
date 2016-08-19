import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

import {AppComponent} from './app.component';
import {routing} from "./app.routes";
import {SessionService} from "./session/session.service";
import {LoggedInGuard} from "./session/logged-in.guard";
import {EntityMapperService} from "./model/entity-mapper.service";
import {LoginComponent} from "./session/login.component";
import {FooterComponent} from "./footer.component";
import {AlertsModule} from "./alerts/alerts.module";
import {NG2BootstrapModule} from "./ng2-bootstrap.module";
import {DatabaseModule} from "./database/database.module";
import {ConfigModule} from "./config/config.module";
import SessionModule from "./session/session.module";
import {SyncStatusModule} from "./sync-status/sync-status.module";
import {DashboardModule} from "./dashboard/dashboard.module";
import {NavigationModule} from "./navigation/navigation.module";

@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        LoginComponent
    ],
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
        NavigationModule
        // UserModule is lazy loaded
    ],
    bootstrap: [AppComponent],
    providers: [
        SessionService,
        LoggedInGuard,
        EntityMapperService
    ]
})
export class AppModule {
}
