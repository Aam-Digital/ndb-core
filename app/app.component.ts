import { Component, provide, ViewContainerRef } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';

import { FooterComponent } from './footer.component';
import { NavigationComponent } from './navigation/navigation.component';
import { AlertsComponent } from "./alerts/alerts.component";
import { LoginComponent } from './user/login.component';
import { SessionService } from "./user/session.service";
import { ConfigService } from "./config/config.service";
import { DatabaseManagerService, databaseServiceProvider } from "./database/database-manager.service";
import { AlertService } from "./alerts/alert.service";
import { PouchDatabaseManagerService } from "./database/pouch-database-manager.service";
import { EntityMapperService } from "./database/entity-mapper.service";
import { SyncStatusComponent } from "./sync-status/sync-status.component";
import { LoggedInGuard } from "./user/logged-in.guard";
import { appRouterProviders } from "./app.routes";
import { NavigationItemsService } from "./navigation/navigation-items.service";


@Component({
    selector: 'ndb-app',
    templateUrl: 'app/app.component.html',
    styleUrls: ['app/sb-admin-2.css', 'app/app.component.css'], //TODO: use sass for css?
    directives: [
        ROUTER_DIRECTIVES,
        FooterComponent,
        NavigationComponent,
        AlertsComponent,
        LoginComponent,
        SyncStatusComponent
    ],
    providers: [
        SessionService,
        ConfigService,
        AlertService,
        { provide: DatabaseManagerService, useClass: PouchDatabaseManagerService },
        databaseServiceProvider,
        EntityMapperService,
        appRouterProviders,
        LoggedInGuard,
        NavigationItemsService
    ]
})
export class AppComponent {
    constructor(private _sessionService:SessionService,
                viewContainerRef:ViewContainerRef) {
        this.viewContainerRef = viewContainerRef;
    }

    title = 'NDB';
    viewContainerRef:ViewContainerRef;
    isLoggedIn() {
        return this._sessionService.isLoggedIn();
    }
}
