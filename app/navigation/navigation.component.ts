import { Component } from 'angular2/core';
import { RouterLink } from "angular2/router";

import { SessionService } from "../user/session.service";


@Component({
    selector: 'ndb-navigation',
    templateUrl: 'app/navigation/navigation.component.html',
    styleUrls: ['app/navigation/navigation.component.css'],
    directives: [RouterLink]
})
export class NavigationComponent {
    constructor(
        private _sessionService: SessionService) { }

    menu_main = [
        {title: "menu1", icon: "home", url: "/1"},
        {title: "menu2", icon: "child", url: "/2"}
    ];

    logout() {
        this._sessionService.logout();
    }
}
