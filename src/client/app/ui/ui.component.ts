import {Component, ViewContainerRef} from '@angular/core';
import {SessionService} from '../session/session.service';
import {NavigationItemsService} from '../navigation/navigation-items.service';
import {MenuItem} from '../navigation/menu-item';

@Component({
    moduleId: module.id,
    selector: 'ndb-ui',
    templateUrl: 'ui.component.html',
    styleUrls: ['ui.component.css'], //TODO: use sass for css?

})
export class UIComponent {
    title = 'NDB';
    viewContainerRef: ViewContainerRef;

    constructor(private _sessionService: SessionService,
                viewContainerRef: ViewContainerRef,
                private _navigationItemsService: NavigationItemsService) {
        this.viewContainerRef = viewContainerRef;

        let menuItems = [
            new MenuItem('Dashboard', 'home', ['/']),
            new MenuItem('Test', 'child', ['/'])
        ];
        _navigationItemsService.setMenuItems(menuItems);
    }

    isLoggedIn() {
        return this._sessionService.isLoggedIn();
    }
}
