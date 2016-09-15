import { Injectable } from '@angular/core';
import { MenuItem } from "./menu-item";


@Injectable()
export class NavigationItemsService {

    menuItems : MenuItem[] = [];

    public getMenuItems() : MenuItem[] {
        return this.menuItems;
    }

    public addMenuItem(menuItem: MenuItem) {
        this.menuItems.push(menuItem);
    }

    public setMenuItems(items : MenuItem[]) {
        this.menuItems = items;
    }
}
