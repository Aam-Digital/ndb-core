import { Component, inject, OnInit } from "@angular/core";
import {
  MenuItem,
  NavigationMenuConfig,
} from "app/core/ui/navigation/menu-item";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "app/core/config/config";
import { AdminMenuItemComponent } from "./admin-menu-item/admin-menu-item.component";
import { MatButton } from "@angular/material/button";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { Logging } from "app/core/logging/logging.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  MenuItemForAdminUi,
  MenuItemForAdminUiNew,
} from "./menu-item-for-admin-ui";
import { v4 as uuid } from "uuid";
import { MatDialog } from "@angular/material/dialog";
import { AdminMenuItemDetailsComponent } from "./admin-menu-item-details/admin-menu-item-details.component";

/** Load and Store Menu Items for Administration */
@Component({
  selector: "app-admin-menu",
  standalone: true,
  imports: [AdminMenuItemComponent, MatButton, DragDropModule, FaIconComponent],
  templateUrl: "./admin-menu.component.html",
  styleUrl: "./admin-menu.component.scss",
})
export class AdminMenuComponent implements OnInit {
  menuItems: MenuItemForAdminUi[];
  readonly navigationContainer = "navigation-container";


  constructor(private dialog: MatDialog, private readonly entityMapper: EntityMapperService) {}

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
    const { uniqueId, isNew, ...rest } = item as any;

    // If it's an EntityMenuItem (has entityType), only keep entityType and subMenu
    if ("entityType" in rest && rest.entityType) {
      const entityMenuItem: any = { entityType: rest.entityType };
      if (item.subMenu?.length) {
        entityMenuItem.subMenu = item.subMenu.map((sub) =>
          this.toPlainMenuItem(sub),
        );
      }
      return entityMenuItem;
    }

    // Otherwise, return as normal MenuItem
    return {
      label: rest.label,
      icon: rest.icon,
      link: rest.link,
      subMenu: item.subMenu?.length
        ? item.subMenu.map((sub) => this.toPlainMenuItem(sub))
        : undefined,
    };
  }

  async cancel() {
    await this.loadNavigationConfig();
  }

  async addNewMenuItem() {
    const newItem = new MenuItemForAdminUiNew(uuid());
    const dialogRef = this.dialog.open(AdminMenuItemDetailsComponent, {
      width: "600px",
      data: { item: { ...newItem }, isNew: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.menuItems = [result, ...this.menuItems];
      }
    });
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
