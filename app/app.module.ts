import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

import {AppComponent} from './app.component';
import {routing} from "./app.routes";
import {SessionService} from "./user/session.service";
import {LoggedInGuard} from "./user/logged-in.guard";
import {EntityMapperService} from "./model/entity-mapper.service";
import {NavigationItemsService} from "./navigation/navigation-items.service";
import {SyncStatusComponent} from "./sync-status/sync-status.component";
import {LoginComponent} from "./user/login.component";
import {FooterComponent} from "./footer.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {AlertsModule} from "./alerts/alerts.module";
import {NG2BootstrapModule} from "./ng2-bootstrap.module";
import {DatabaseModule} from "./database/database.module";
import {ConfigModule} from "./config/config.module";

@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        NavigationComponent,
        LoginComponent,
        SyncStatusComponent
    ],
    imports: [
        BrowserModule,
        routing,
        FormsModule,
        AlertsModule,
        NG2BootstrapModule,
        DatabaseModule,
        ConfigModule
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
