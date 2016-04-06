import { Injectable } from 'angular2/core';
import { MenuItem } from "./menu-item";


@Injectable()
export class NavigationItemsService {

    public getMenuItems() : MenuItem[] {
        return [
            new MenuItem("Dashboard", "home", ['Home']),
            new MenuItem("Test", "child", ['Home'])
        ];
    }
}
