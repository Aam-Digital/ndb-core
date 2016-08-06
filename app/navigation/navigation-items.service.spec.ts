import { NavigationItemsService } from "./navigation-items.service";

describe('navigation-items service tests', () => {

    it('has some MenuItems', function () {
        let navigationItemsService = new NavigationItemsService();
        let items = navigationItemsService.getMenuItems();

        expect(items).toBeDefined();
        expect(items.length).toBeGreaterThan(0);
    });

});
