import { Component, provide, ViewContainerRef } from '@angular/core';
import { ROUTER_DIRECTIVES, RouteConfig } from '@angular/router-deprecated';

import { FooterComponent } from './footer.component';
import { NavigationComponent } from './navigation/navigation.component';
import { AlertsComponent } from "./alerts/alerts.component";
import { LoginComponent } from './user/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SessionService } from "./user/session.service";
import { UserAccountComponent } from "./user/user-account.component";
import { ConfigService } from "./config/config.service";
import { DatabaseManagerService, databaseServiceProvider } from "./database/database-manager.service";
import { AlertService } from "./alerts/alert.service";
import { PouchDatabaseManagerService } from "./database/pouch-database-manager.service";
import { EntityMapperService } from "./database/entity-mapper.service";
import { SyncStatusComponent } from "./sync-status/sync-status.component";


@RouteConfig([
    {
        path: '/',
        name: 'Home',
        component: DashboardComponent,
        useAsDefault: true
    },
    {
        path: '/user',
        name: 'User',
        component: UserAccountComponent
    }
])

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
        provide(DatabaseManagerService, {useClass: PouchDatabaseManagerService}),
        databaseServiceProvider,
        EntityMapperService
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
