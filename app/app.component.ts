import {Component, ViewContainerRef} from '@angular/core';

import {SessionService} from "./session/session.service";


@Component({
    selector: 'ndb-app',
    templateUrl: 'app/app.component.html',
    styleUrls: ['app/sb-admin-2.css', 'app/app.component.css'], //TODO: use sass for css?

})
export class AppComponent {
    constructor(private _sessionService: SessionService,
                viewContainerRef: ViewContainerRef) {
        this.viewContainerRef = viewContainerRef;
    }

    title = 'NDB';
    viewContainerRef: ViewContainerRef;

    isLoggedIn() {
        return this._sessionService.isLoggedIn();
    }
}
