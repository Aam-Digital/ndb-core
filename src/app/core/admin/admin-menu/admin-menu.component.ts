import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MenuItem, NavigationMenuConfig } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "app/core/config/config";
import { AdminComponent } from "app/admin/admin.component";

/** Load and Store Menu Items for Administration */
@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, AdminComponent, MatListModule, MenuItemComponent],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss'
})
export class AdminMenuComponent {
  menuItems: MenuItem[];

  constructor(private entityMapper: EntityMapperService) {
    this.loadNavigationConfig();
  }

  private async loadNavigationConfig() {
    const configEntity = await this.entityMapper.load(Config<{navigationMenu: NavigationMenuConfig}>, Config.CONFIG_KEY);
    this.menuItems = configEntity.data.navigationMenu.items;
  }

  saveMenuItems(newMenuItems: MenuItem[]) {
    // TODO
    console.log("saveMenuItems", newMenuItems);
  }
}
