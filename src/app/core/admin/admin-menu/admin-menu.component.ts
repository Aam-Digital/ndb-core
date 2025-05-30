import { Component } from "@angular/core";
import {
  MenuItem,
  NavigationMenuConfig,
} from "app/core/ui/navigation/menu-item";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "app/core/config/config";
import { AdminMenuListComponent } from "app/core/admin/admin-menu/admin-menu-list/admin-menu-list.component";
import { MatButton } from "@angular/material/button";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { NgFor } from "@angular/common";
import { Logging } from "app/core/logging/logging.service";

/** Load and Store Menu Items for Administration */
@Component({
  selector: "app-admin-menu",
  standalone: true,
  imports: [AdminMenuListComponent, MatButton, DragDropModule, NgFor],
  templateUrl: "./admin-menu.component.html",
  styleUrl: "./admin-menu.component.scss",
})
export class AdminMenuComponent {
  menuItems: MenuItem[];
  readonly navigationContainer = "navigation-container";

  constructor(private entityMapper: EntityMapperService) {
    this.loadNavigationConfig();
  }

  private async loadNavigationConfig() {
    const configEntity = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    this.menuItems = this.addUniqueIds(configEntity.data.navigationMenu.items);
  }

  // Add unique IDs to all menu items for drag and drop functionality
  // This is necessary to ensure that each item can be uniquely identified
  private addUniqueIds(items: MenuItem[]): MenuItem[] {
    return items.map((item) => ({
      ...item,
      uniqueId: this.generateUniqueId(),
      subMenu: item.subMenu ? this.addUniqueIds(item.subMenu) : [],
    }));
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  public get connectedDropLists(): string[] {
    return [
      this.navigationContainer,
      ...this.getIdsRecursive(this.menuItems),
    ].reverse();
  }

  onDragDrop(event: CdkDragDrop<MenuItem[]>) {
    try {
      if (event.previousContainer === event.container) {
        moveItemInArray(
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      } else {
        const itemToTransfer = {
          ...event.previousContainer.data[event.previousIndex],
        };

        if (!itemToTransfer.subMenu) {
          itemToTransfer.subMenu = [];
        }

        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );

        if (event.container.id === this.navigationContainer) {
          this.menuItems = [...this.menuItems];
        }
      }
    } catch (error) {
      Logging.debug("Drag drop error:", error);
    }
  }

  private normalizeMenuItems(items: MenuItem[]): MenuItem[] {
    return items.map((item) => ({
      ...item,
      uniqueId: item.uniqueId || this.generateUniqueId(),
      subMenu: item.subMenu ? this.normalizeMenuItems(item.subMenu) : [],
    }));
  }

  // Recursively get all IDs for connected drop lists
  private getIdsRecursive(items: MenuItem[]): string[] {
    let ids: string[] = [];
    items?.forEach((item) => {
      ids.push(item.uniqueId);
      if (item.subMenu) {
        ids = ids.concat(this.getIdsRecursive(item.subMenu));
      }
    });
    return ids;
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
