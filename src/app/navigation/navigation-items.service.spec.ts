import { TestBed, inject } from '@angular/core/testing';

import { NavigationItemsService } from './navigation-items.service';
import { MenuItem } from './menu-item';

describe('NavigationItemsService', () => {
  it('adds menu item', function () {
    const navigationItemsService = new NavigationItemsService();
    const item = new MenuItem('test', 'child', ['/']);

    navigationItemsService.addMenuItem(item);

    const items = navigationItemsService.getMenuItems();

    expect(items).toBeDefined();
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(item);
  });
});
