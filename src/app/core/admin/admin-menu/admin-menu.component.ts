import { Component } from "@angular/core";
import {
  MenuItem,
  NavigationMenuConfig,
} from "app/core/ui/navigation/menu-item";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "app/core/config/config";
import { AdminMenuListComponent } from "app/core/admin/admin-menu/admin-menu-list/admin-menu-list.component";
import { MatButton } from "@angular/material/button";

/** Load and Store Menu Items for Administration */
@Component({
  selector: "app-admin-menu",
  standalone: true,
  imports: [AdminMenuListComponent, MatButton],
  templateUrl: "./admin-menu.component.html",
  styleUrl: "./admin-menu.component.scss",
})
export class AdminMenuComponent {
  menuItems: MenuItem[];

  constructor(private entityMapper: EntityMapperService) {
    this.loadNavigationConfig();
  }

  private async loadNavigationConfig() {
    const configEntity = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    this.menuItems = configEntity.data.navigationMenu.items;
  }

  async save() {
    const currentConfig = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    currentConfig.data.navigationMenu.items = this.menuItems;
    await this.entityMapper.save(currentConfig);
  }

  async cancel() {
    await this.loadNavigationConfig();
  }
}
