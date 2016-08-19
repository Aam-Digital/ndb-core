import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

import {AppComponent} from './app.component';
import {routing} from "./app.routes";
import {SessionService} from "./session/session.service";
import {LoggedInGuard} from "./session/logged-in.guard";
import {NavigationItemsService} from "./navigation/navigation-items.service";
import {SyncStatusComponent} from "./sync-status/sync-status.component";
import {LoginComponent} from "./session/login.component";
import {FooterComponent} from "./footer.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {AlertsModule} from "./alerts/alerts.module";
import {NG2BootstrapModule} from "./ng2-bootstrap.module";
import {DatabaseModule} from "./database/database.module";
import {ConfigModule} from "./config/config.module";
import SessionModule from "./session/session.module";

@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        NavigationComponent,
        SyncStatusComponent
    ],
    imports: [
        BrowserModule,
        routing,
        FormsModule,
        AlertsModule,
        NG2BootstrapModule,
        DatabaseModule,
        ConfigModule,
        SessionModule
        // UserModule is lazy loaded
    ],
    bootstrap: [AppComponent],
    providers: [
        NavigationItemsService
    ]
})
export class AppModule {
}
