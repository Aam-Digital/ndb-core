import { Injectable, inject } from "@angular/core";
import { ConfigService } from "app/core/config/config.service";
import { EntityMenuItem, MenuItem, NavigationMenuConfig } from "./menu-item";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  private configService = inject(ConfigService);
  private entities = inject(EntityRegistry);

  /**
   * name of config array in the config json file
   */
  private readonly CONFIG_ID = "navigationMenu";

  /**
   * The current menu items to be displayed, loaded and automatically updated from the config.
   */
  menuItems = new BehaviorSubject<MenuItem[]>([]);

  constructor() {
    this.configService.configUpdates.subscribe(() =>
      this.initMenuItemsFromConfig(),
    );
  }

  /**
   * Load menu items from config file
   */
  private async initMenuItemsFromConfig() {
    const config = this.configService.getConfig<NavigationMenuConfig>(
      this.CONFIG_ID,
    );

    const menuItems = (config?.items ?? []).map((item) =>
      this.generateMenuItemForEntityType(item),
    );

    this.menuItems.next(menuItems);
  }

  /**
   * parse special EntityMenuItem to regular item recursively
   * by looking up the entityType from EntityRegistry and then using its config.
   */
  generateMenuItemForEntityType(item: MenuItem): MenuItem {
    const newItem: Partial<MenuItem> = { ...item };
    if ("entityType" in item) {
      const entityType = this.entities.get((item as EntityMenuItem).entityType);
      delete newItem["entityType"];
      newItem.label = item.label ?? entityType.labelPlural;
      newItem.icon = item.icon ?? entityType.icon;
      newItem.link = entityType.route;
    }

    if (item.subMenu) {
      newItem.subMenu = item.subMenu.map((subItem) =>
        this.generateMenuItemForEntityType(subItem),
      );
    }

    return newItem as MenuItem;
  }
}
