import { Component, OnInit } from "@angular/core";
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
import { Logging } from "app/core/logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  MenuItemForAdminUi,
  MenuItemForAdminUiNew,
} from "./menu-item-for-admin-ui";
import { v4 as uuid } from "uuid";

/** Load and Store Menu Items for Administration */
@Component({
  selector: "app-admin-menu",
  standalone: true,
  imports: [AdminMenuListComponent, MatButton, DragDropModule, FaIconComponent],
  templateUrl: "./admin-menu.component.html",
  styleUrl: "./admin-menu.component.scss",
})
export class AdminMenuComponent implements OnInit {
  menuItems: MenuItemForAdminUi[];
  readonly navigationContainer = "navigation-container";

  constructor(
    private entityMapper: EntityMapperService,
    private dialog: MatDialog,
  ) {}

  async ngOnInit() {
    await this.loadNavigationConfig();
  }

  private async loadNavigationConfig() {
    const configEntity = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    this.menuItems = this.addUniqueIds(configEntity.data.navigationMenu.items);
  }

  /**
   * Add unique IDs to all menu items for drag and drop functionality.
   * This is necessary to ensure that each item can be uniquely identified
   */
  private addUniqueIds(items: MenuItem[]): MenuItemForAdminUi[] {
    return items.map((item) => ({
      ...item,
      uniqueId: uuid(),
      subMenu: item.subMenu ? this.addUniqueIds(item.subMenu) : [],
    }));
  }

  public get connectedDropLists(): string[] {
    return [
      this.navigationContainer,
      ...this.getIdsRecursive(this.menuItems),
    ].reverse();
  }

  private getIdsRecursive(items: MenuItemForAdminUi[]): string[] {
    let ids: string[] = [];
    items?.forEach((item) => {
      ids.push(item.uniqueId);
      if (item.subMenu) {
        ids = ids.concat(this.getIdsRecursive(item.subMenu));
      }
    });
    return ids;
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

  async save() {
    const currentConfig = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    currentConfig.data.navigationMenu.items = this.menuItems.map((item) =>
      this.toPlainMenuItem(item),
    );
    await this.entityMapper.save(currentConfig);
  }

  private toPlainMenuItem(item: MenuItemForAdminUi): MenuItem {
    delete item.uniqueId; // Remove uniqueId before saving
    return {
      ...item,
      subMenu:
        item.subMenu?.length > 0
          ? item.subMenu.map((sub) => this.toPlainMenuItem(sub))
          : undefined,
    };
  }

  async cancel() {
    await this.loadNavigationConfig();
  }

  async addNewMenuItem() {
    const newItem = new MenuItemForAdminUiNew(uuid());
    this.menuItems = [newItem, ...this.menuItems];
  }

  removeItem(item: MenuItemForAdminUi): void {
    this.menuItems = this.menuItems.filter((i) => i !== item);
  }

  onItemChange(newItem: MenuItemForAdminUi, index: number) {
    this.menuItems = [
      ...this.menuItems.slice(0, index),
      newItem,
      ...this.menuItems.slice(index + 1),
    ];
  }
}
