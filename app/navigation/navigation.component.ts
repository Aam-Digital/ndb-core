import { Component } from '@angular/core';

import { SessionService } from "../session/session.service";
import { NavigationItemsService } from "./navigation-items.service";
import { MenuItem } from "./menu-item";


@Component({
    selector: 'ndb-navigation',
    templateUrl: 'app/navigation/navigation.component.html',
    styleUrls: ['app/navigation/navigation.component.css'],
})
export class NavigationComponent {
    public menu_main: MenuItem[];

    constructor(
        private _sessionService: SessionService,
        private _navigationItemService: NavigationItemsService) {

        this.menu_main = this._navigationItemService.getMenuItems();
    }

    logout() {
        this._sessionService.logout();
    }
}
