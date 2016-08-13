import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES } from "@angular/router";

import { SessionService } from "../user/session.service";
import { NavigationItemsService } from "./navigation-items.service";
import { MenuItem } from "./menu-item";


@Component({
    selector: 'ndb-navigation',
    templateUrl: 'app/navigation/navigation.component.html',
    styleUrls: ['app/navigation/navigation.component.css'],
    directives: [ROUTER_DIRECTIVES]
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
