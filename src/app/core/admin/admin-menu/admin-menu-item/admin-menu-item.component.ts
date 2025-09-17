import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { firstValueFrom } from "rxjs";
import { AdminMenuItemDetailsComponent } from "../admin-menu-item-details/admin-menu-item-details.component";
import {
  MenuItemForAdminUi,
  MenuItemForAdminUiNew,
} from "../menu-item-for-admin-ui";
import { MatNavList } from "@angular/material/list";
import { MatIconButton } from "@angular/material/button";

/**
 * Display and edit a menu item in the admin interface,
 * including recursively editing and drag&drop of subMenu items.
 */
@Component({
  selector: "app-admin-menu-item",
  standalone: true,
  imports: [
    MatNavList,
    MenuItemComponent,
    FaIconComponent,
    DragDropModule,
    MatFormFieldModule,
    FormsModule,
    MatIconButton,
  ],
  templateUrl: "./admin-menu-item.component.html",
  styleUrls: [
    "./admin-menu-item.component.scss",
    "../../../ui/navigation/menu-item/menu-item.component.scss",
  ],
})
export class AdminMenuItemComponent {
  private dialog = inject(MatDialog);
  private menuService = inject(MenuService);

  @Input() set item(value: MenuItemForAdminUi | MenuItemForAdminUiNew) {
    if (value instanceof MenuItemForAdminUiNew) {
      this._item = undefined;
      this.itemToDisplay = undefined;
      this.editMenuItem(value);
      return;
    }

    this._item = value;
    const plainItem = this.menuService.generateMenuItemForEntityType(this.item);
    delete plainItem.link;
    delete plainItem.subMenu;
    this.itemToDisplay = plainItem;
  }

  get item(): MenuItemForAdminUi {
    return this._item;
  }

  private _item: MenuItemForAdminUi;
  itemToDisplay: MenuItem;

  @Output() itemChange = new EventEmitter<MenuItemForAdminUi>();

  @Input() connectedTo: string[];

  /** Whether entity type links are allowed (false for shortcuts, true for admin menu) */
  @Input() allowEntityLinks: boolean = true;

  /** Whether sub-menus are allowed for this item type */
  @Input() allowSubMenu: boolean = true;
  
  @Output() itemDrop = new EventEmitter<CdkDragDrop<MenuItemForAdminUi[]>>();
  @Output() deleteItem = new EventEmitter<MenuItemForAdminUi>();

  removeSubItem(item: MenuItemForAdminUi): void {
    this.item = {
      ...this.item,
      subMenu: [...this.item.subMenu.filter((i) => i !== item)],
    };
    this.itemChange.emit(this.item);
  }

  onSubItemChange(updatedSubItem: MenuItemForAdminUi) {
    this.item = {
      ...this.item,
      subMenu: this.item.subMenu.map((sub) =>
        sub.uniqueId === updatedSubItem.uniqueId ? updatedSubItem : sub,
      ),
    };
    this.itemChange.emit(this.item);
  }

  onDelete(item: MenuItemForAdminUi): void {
    this.deleteItem.emit(item);
  }

  onDragDrop(event: CdkDragDrop<MenuItemForAdminUi[]>) {
    this.itemDrop.emit(event);
  }

  async editMenuItem(item: MenuItemForAdminUi | MenuItemForAdminUiNew) {
    const updatedItem = await this.openEditDialog(item);
    if (updatedItem) {
      this.item = { ...item, ...updatedItem };
      this.itemChange.emit(this.item);
    }
  }

  private async openEditDialog(
    item: MenuItemForAdminUi | MenuItemForAdminUiNew,
  ): Promise<MenuItemForAdminUi | undefined> {
    const dialogRef = this.dialog.open(AdminMenuItemDetailsComponent, {
      width: "600px",
      data: {
        item: item ? { ...item } : {},
        isNew: (item as MenuItemForAdminUiNew).isNew,
        allowEntityLinks: this.allowEntityLinks,
      },
    });
    return firstValueFrom(dialogRef.afterClosed());
  }
}
