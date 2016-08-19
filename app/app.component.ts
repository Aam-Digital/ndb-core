import {Component, ViewContainerRef} from '@angular/core';
<<<<<<< dec6842c2d43870cc6fb007b10511aa6bb5a9905

import {SessionService} from "./session/session.service";
=======
import {SessionService} from "./user/session.service";
import {NavigationItemsService} from "./navigation/navigation-items.service";
import {MenuItem} from "./navigation/menu-item";
>>>>>>> Provide extendable navigation bar as a service

@Component({
    selector: 'ndb-app',
    templateUrl: 'app/app.component.html',
    styleUrls: ['app/sb-admin-2.css', 'app/app.component.css'], //TODO: use sass for css?

})
export class AppComponent {
    constructor(private _sessionService: SessionService,
                viewContainerRef: ViewContainerRef,
                private _navigationItemsService: NavigationItemsService) {
        this.viewContainerRef = viewContainerRef;

        let menuItems = [
            new MenuItem("Dashboard", "home", ['/']),
            new MenuItem("Test_", "child", ['/'])
        ];
        _navigationItemsService.setMenuItems(menuItems);
    }

    title = 'NDB';
    viewContainerRef: ViewContainerRef;

    isLoggedIn() {
        return this._sessionService.isLoggedIn();
    }
}
