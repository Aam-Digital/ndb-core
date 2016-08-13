import { Injectable } from '@angular/core';
import { MenuItem } from "./menu-item";


@Injectable()
export class NavigationItemsService {

    public getMenuItems() : MenuItem[] {
        return [
            new MenuItem("Dashboard", "home", ['/']),
            new MenuItem("Test", "child", ['/'])
        ];
    }
}
