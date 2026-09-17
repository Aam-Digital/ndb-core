import {
  Component,
  computed,
  inject,
  input,
  model,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { v4 as uuid } from "uuid";
import { MatDialog } from "@angular/material/dialog";
import {
  FlatTreeOptions,
  FlatTreeRow,
  flattenTree,
  moveSubtree,
  rebuildTree,
  removeSubtree,
  updateRow,
} from "#src/app/utils/flat-tree/flat-tree";
import { MenuItem } from "../navigation/menu-item";
import { AdminMenuItemComponent } from "../../admin/admin-menu/admin-menu-item/admin-menu-item.component";
import {
  EditableMenuItem,
  menuItemTree,
  MenuItemForAdminUi,
  MenuItemForAdminUiNew,
} from "../../admin/admin-menu/menu-item-for-admin-ui";
import { AdminMenuItemDetailsComponent } from "../../admin/admin-menu/admin-menu-item-details/admin-menu-item-details.component";
import { IconButtonComponent } from "../../common-components/icon-button/icon-button.component";

/**
 * A reusable component for editing lists of menu items with drag & drop,
 * add/remove functionality. Used by both AdminMenuComponent and
 * ShortcutDashboardSettingsComponent.
 *
 * The (possibly nested) menu is edited as a single flat, indented list (see `flat-tree`):
 * dragging an item sideways nests it into the item above or lifts it back out, and dragging
 * an item with sub-items carries its whole subtree.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-menu-item-list-editor",
  imports: [AdminMenuItemComponent, DragDropModule, IconButtonComponent],
  templateUrl: "./menu-item-list-editor.component.html",
  styleUrl: "./menu-item-list-editor.component.scss",
})
export class MenuItemListEditorComponent {
  private readonly dialog = inject(MatDialog);

  items = model<MenuItemForAdminUi[]>([]);

  showAddButton = input<boolean>(true);

  /** Whether entity type links are allowed (false for shortcuts, true for admin menu) */
  allowEntityLinks = input<boolean>(true);

  /** Whether items may be nested into sub-menus (false for shortcuts) */
  allowSubMenu = input<boolean>(true);

  /** pixels of indentation per nesting level */
  readonly indentPerLevel = 32;

  /**
   * The menu as a flat, indented list of rows, each with the display flags the template needs:
   * an item has sub-items when the row below it is deeper.
   */
  readonly rows = computed(() => {
    const rows = flattenTree(this.items(), menuItemTree);
    return rows.map((row, index) => ({
      ...row,
      hasSubItems: rows[index + 1]?.level > row.level,
    }));
  });

  private readonly nesting = computed<FlatTreeOptions>(() => ({
    maxLevel: this.allowSubMenu() ? undefined : 0,
  }));

  onDrop(event: CdkDragDrop<unknown>): void {
    // how far the item was dragged sideways determines how deep it is nested;
    // truncated, so that only a full indentation step re-nests (and not slight drift)
    const levelDelta = Math.trunc(event.distance.x / this.indentPerLevel);
    this.setRows(
      moveSubtree(
        this.rows(),
        event.previousIndex,
        event.currentIndex,
        menuItemTree,
        { ...this.nesting(), levelDelta },
      ),
    );
  }

  /** remove the item at `index` and, with it, its sub-items */
  removeItem(index: number): void {
    this.setRows(
      removeSubtree(this.rows(), index, menuItemTree, this.nesting()),
    );
  }

  onItemChange(newItem: MenuItemForAdminUi, index: number): void {
    this.setRows(updateRow(this.rows(), index, newItem));
  }

  private setRows(rows: FlatTreeRow<MenuItemForAdminUi>[]): void {
    this.items.set(rebuildTree(rows, menuItemTree));
  }

  async addNewMenuItem() {
    const newItem = new MenuItemForAdminUiNew(uuid());
    const dialogRef = this.dialog.open(AdminMenuItemDetailsComponent, {
      width: "600px",
      data: {
        item: { ...newItem },
        isNew: true,
        allowEntityLinks: this.allowEntityLinks(),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const normalizedItem: MenuItemForAdminUi = {
          ...result,
          uniqueId: uuid(),
          subMenu:
            this.allowSubMenu() && result.subMenu
              ? MenuItemListEditorComponent.addUniqueIds(result.subMenu)
              : [],
        };
        this.items.update((curr) => [normalizedItem, ...curr]);
      }
    });
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
  static toPlainMenuItem(
    item: MenuItemForAdminUi,
    opts?: { forceLinkOnly?: boolean },
  ): EditableMenuItem | null {
    if ("entityType" in item && item.entityType) {
      if (opts?.forceLinkOnly) {
        // For shortcuts, entity items should not be included
        // They are filtered out in the UI, but this handles edge cases
        return null;
      }

      const entityMenuItem: any = { entityType: item.entityType };
      if (item.subMenu?.length) {
        entityMenuItem.subMenu = item.subMenu
          .map((sub) => MenuItemListEditorComponent.toPlainMenuItem(sub, opts))
          .filter((sub) => sub !== null);
      }
      return entityMenuItem;
    }

    // Otherwise, return as normal MenuItem
    return {
      label: item.label,
      icon: item.icon,
      link: item.link,
      subMenu:
        opts?.forceLinkOnly || !item.subMenu?.length
          ? undefined
          : item.subMenu.map((sub) =>
              MenuItemListEditorComponent.toPlainMenuItem(sub, opts),
            ),
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
  static toPlainMenuItems(
    items: MenuItemForAdminUi[],
    opts?: { forceLinkOnly?: boolean },
  ): EditableMenuItem[] {
    return items
      .map((item) => MenuItemListEditorComponent.toPlainMenuItem(item, opts))
      .filter((item): item is MenuItem => item !== null);
  }
}
