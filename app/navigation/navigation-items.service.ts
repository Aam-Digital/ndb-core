import { Injectable } from '@angular/core';
import { MenuItem } from "./menu-item";


@Injectable()
export class NavigationItemsService {

    menuItems : MenuItem[] = [];

    public getMenuItems() : MenuItem[] {
        return this.menuItems;
    }

    public addMenuItem(label: string, icon: string, routerLinkParameters: any[]) {
        this.menuItems.push(new MenuItem(label, icon, routerLinkParameters));
    }

    public setMenuItems(items : MenuItem[]) {
        this.menuItems = items;
    }
}
