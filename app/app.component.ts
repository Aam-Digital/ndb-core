import { Component } from 'angular2/core';
import { RouteConfig, ROUTER_DIRECTIVES } from 'angular2/router';

import { FooterComponent } from './footer.component';
import { NavigationComponent } from './navigation/navigation.component';
import { AlertsComponent } from "./alerts/alerts.component";
import { LoginComponent } from './user/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SessionService } from "./user/session.service";
import { UserAccountComponent } from "./user/user-account.component";
import {ConfigService} from "./config/config.service";
import { DatabaseManagerService, databaseServiceProvider } from "./database/database-manager.service";


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
        LoginComponent
    ],
    providers: [
        SessionService,
        ConfigService,
        DatabaseManagerService,
        databaseServiceProvider
    ]
})
export class AppComponent {

    constructor(private _sessionService: SessionService) { }

    title = 'NDB';
    isLoggedIn() {
        return this._sessionService.isLoggedIn();
    }
}
