import { Component } from 'angular2/core';


@Component({
    selector: 'ndb-navigation',
    templateUrl: 'app/navigation/navigation.component.html'
})

export class NavigationComponent {
    menu_main = [
        {title: "menu1", icon: "home", url: "/1"},
        {title: "menu2", icon: "child", url: "/2"}
    ]
}
