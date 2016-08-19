import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

import {AppComponent} from './app.component';
import {routing} from "./app.routes";
import {SessionService} from "./session/session.service";
import {LoggedInGuard} from "./session/logged-in.guard";
import {EntityMapperService} from "./model/entity-mapper.service";
import {NavigationItemsService} from "./navigation/navigation-items.service";
import {LoginComponent} from "./session/login.component";
import {FooterComponent} from "./footer.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {AlertsModule} from "./alerts/alerts.module";
import {NG2BootstrapModule} from "./ng2-bootstrap.module";
import {DatabaseModule} from "./database/database.module";
import {ConfigModule} from "./config/config.module";
import {SyncStatusModule} from "./sync-status/sync-status.module";
import {DashboardModule} from "./dashboard/dashboard.module";

@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        NavigationComponent,
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
        SyncStatusModule,
        DashboardModule
        // UserModule is lazy loaded
    ],
    bootstrap: [AppComponent],
    providers: [
        SessionService,
        LoggedInGuard,
        NavigationItemsService,
        EntityMapperService
    ]
})
export class AppModule {
}
