import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { v4 as uuid } from "uuid";
import { MatDialog } from "@angular/material/dialog";
import { Logging } from "../../logging/logging.service";
import { MenuItem } from "../navigation/menu-item";
import { AdminMenuItemComponent } from "../../admin/admin-menu/admin-menu-item/admin-menu-item.component";
import {
  MenuItemForAdminUi,
  MenuItemForAdminUiNew,
} from "../../admin/admin-menu/menu-item-for-admin-ui";
import { AdminMenuItemDetailsComponent } from "../../admin/admin-menu/admin-menu-item-details/admin-menu-item-details.component";

/**
 * A reusable component for editing lists of menu items with drag & drop,
 * add/remove functionality. Used by both AdminMenuComponent and
 * ShortcutDashboardSettingsComponent.
 */
@Component({
  selector: "app-menu-item-list-editor",
  standalone: true,
  imports: [AdminMenuItemComponent, MatButton, DragDropModule, FaIconComponent],
  templateUrl: "./menu-item-list-editor.component.html",
  styleUrl: "./menu-item-list-editor.component.scss",
})
export class MenuItemListEditorComponent {
  private readonly dialog = inject(MatDialog);

  @Input() items: MenuItemForAdminUi[] = [];
  @Input() showAddButton: boolean = true;
  @Input() addButtonLabel: string = "Add New";
  @Input() containerId: string = "menu-item-list-container";
  @Input() itemType: string = "Menu Item";
  @Input() allowSubMenu: boolean = true;
  @Input() excludeNavigationItems: boolean = false;

  @Output() itemsChange = new EventEmitter<MenuItemForAdminUi[]>();

  public get connectedDropLists(): string[] {
    if (!this.allowSubMenu) {
      // For shortcuts, only allow drops in the main container
      return [this.containerId];
    }
    return [this.containerId, ...this.getIdsRecursive(this.items)].reverse();
  }

  private getIdsRecursive(items: MenuItemForAdminUi[]): string[] {
    let ids: string[] = [];
    items?.forEach((item) => {
      ids.push(item.uniqueId);
      if (this.allowSubMenu && item.subMenu) {
        ids = ids.concat(this.getIdsRecursive(item.subMenu));
      }
    });
    return ids;
  }

  onDragDrop(event: CdkDragDrop<MenuItem[]>) {
    try {
      if (event.previousContainer === event.container) {
        // Same container - always allow reordering
        moveItemInArray(
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      } else {
        // Cross-container transfer - only allow if submenus are enabled
        if (!this.allowSubMenu) {
          // For shortcuts, prevent cross-container drops (no submenus allowed)
          return;
        }

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

        if (event.container.id === this.containerId) {
          this.items = [...this.items];
        }
      }
      this.emitItemsChange();
    } catch (error) {
      Logging.debug("Drag drop error:", error);
    }
  }

  async addNewMenuItem() {
    const newItem = new MenuItemForAdminUiNew(uuid());
    const dialogRef = this.dialog.open(AdminMenuItemDetailsComponent, {
      width: "600px",
      data: {
        item: { ...newItem },
        isNew: true,
        itemType: this.itemType,
        excludeNavigationItems: this.excludeNavigationItems,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.items = [result, ...this.items];
        this.emitItemsChange();
      }
    });
  }

  removeItem(item: MenuItemForAdminUi): void {
    this.items = this.items.filter((i) => i !== item);
    this.emitItemsChange();
  }

  onItemChange(newItem: MenuItemForAdminUi, index: number) {
    this.items = [
      ...this.items.slice(0, index),
      newItem,
      ...this.items.slice(index + 1),
    ];
    this.emitItemsChange();
  }

  /**
   * Add unique IDs to all menu items for drag and drop functionality.
   * This is necessary to ensure that each item can be uniquely identified
   */
  static addUniqueIds(items: MenuItem[]): MenuItemForAdminUi[] {
    return items.map((item) => ({
      ...item,
      uniqueId: uuid(),
      subMenu: item.subMenu
        ? MenuItemListEditorComponent.addUniqueIds(item.subMenu)
        : [],
    }));
  }

  /**
   * Convert MenuItemForAdminUi back to plain MenuItem by removing UI-specific properties
   */
  static toPlainMenuItem(item: MenuItemForAdminUi): MenuItem {
    // If it's an EntityMenuItem (has entityType), only keep entityType and subMenu
    if ("entityType" in item && item.entityType) {
      const entityMenuItem: any = { entityType: item.entityType };
      if (item.subMenu?.length) {
        entityMenuItem.subMenu = item.subMenu.map((sub) =>
          MenuItemListEditorComponent.toPlainMenuItem(sub),
        );
      }
      return entityMenuItem;
    }

    // Otherwise, return as normal MenuItem
    return {
      label: item.label,
      icon: item.icon,
      link: item.link,
      subMenu: item.subMenu?.length
        ? item.subMenu.map((sub) =>
            MenuItemListEditorComponent.toPlainMenuItem(sub),
          )
        : undefined,
    };
  }

  /**
   * Convert plain MenuItem array to MenuItemForAdminUi array
   */
  static fromPlainMenuItems(
    items: MenuItem[],
    allowSubMenu: boolean = true,
  ): MenuItemForAdminUi[] {
    const adminItems = MenuItemListEditorComponent.addUniqueIds(items);
    if (!allowSubMenu) {
      // Clean up submenu data for shortcuts
      return adminItems.map((item) => ({
        ...item,
        subMenu: [],
      }));
    }
    return adminItems;
  }

  /**
   * Convert MenuItemForAdminUi array back to plain MenuItem array
   */
  static toPlainMenuItems(items: MenuItemForAdminUi[]): MenuItem[] {
    return items.map((item) =>
      MenuItemListEditorComponent.toPlainMenuItem(item),
    );
  }

  private emitItemsChange() {
    this.itemsChange.emit([...this.items]);
  }
}
