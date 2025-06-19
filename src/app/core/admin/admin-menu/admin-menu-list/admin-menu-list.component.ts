import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule, NgFor } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { EntityMenuItem, MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { DragDropModule, CdkDragDrop } from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { firstValueFrom } from "rxjs";
import { AdminMenuItemComponent } from "../admin-menu-item/admin-menu-item.component";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-admin-menu-list",
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MenuItemComponent,
    FaIconComponent,
    DragDropModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatIconButton,
    MatIconModule,
    NgFor,
  ],
  templateUrl: "./admin-menu-list.component.html",
  styleUrls: [
    "./admin-menu-list.component.scss",
    "../../../ui/navigation/menu-item/menu-item.component.scss",
  ],
})
export class AdminMenuListComponent {
  itemToDisplay: MenuItem;

  @Input() showAddNew: boolean = true;
  @Input() connectedDropLists: string[] = [];

  @Input() set menuItems(value: (MenuItem | EntityMenuItem)[]) {
    this.menuItemsToDisplay = (value ?? []).map((item) => {
      const displayItem = this.menuService.generateMenuItemForEntityType(item);
      delete displayItem.subMenu;
      return { originalItem: item, itemToDisplay: displayItem };
    });
  }
  @Input() connectedTo: string[];
  @Input() set item(value: MenuItem) {
    this._item = value;
    // Ensure subMenu exists as an array if undefined
    if (this._item && !this._item.subMenu) {
      this._item.subMenu = [];
    }
    if (!this.itemToDisplay) {
      this.itemToDisplay = this.menuService.generateMenuItemForEntityType(
        this.item,
      );
    }
  }

  get item(): MenuItem {
    return this._item;
  }
  private _item: MenuItem;

  @Output() itemDrop = new EventEmitter<CdkDragDrop<MenuItem[]>>();
  @Output() readonly menuItemsChange = new EventEmitter<MenuItem[]>();
  @Output() deleteItem = new EventEmitter<MenuItem>();

  menuItemsToDisplay: {
    originalItem: MenuItem | EntityMenuItem;
    itemToDisplay: MenuItem;
  }[] = [];

  constructor(
    private dialog: MatDialog,
    private menuService: MenuService,
  ) {}

  removeSubItem(index: number): void {
    if (index > -1 && this.item?.subMenu) {
      this.item.subMenu.splice(index, 1);
      this.emitChange();
    }
  }

  onDelete(item: MenuItem): void {
    this.deleteItem.emit(item);
  }

  async editMenuItem(item: MenuItem) {
    const updatedItem = await this.openEditDialog(item);
    if (updatedItem) {
      Object.assign(item, updatedItem);
      this.emitChange();
    }
  }

  onDragDrop(event: CdkDragDrop<MenuItem[]>) {
    this.itemDrop.emit(event);
  }

  private async openEditDialog(item?: MenuItem): Promise<MenuItem | undefined> {
    const dialogRef = this.dialog.open(AdminMenuItemComponent, {
      width: "600px",
      data: {
        item: item ? { ...item } : {},
        isNew: !item,
      },
    });
    return firstValueFrom(dialogRef.afterClosed());
  }

  submenuChanged(item: MenuItem, newSubmenu: MenuItem[]) {
    item.subMenu = newSubmenu;
    this.emitChange();
  }

  private emitChange() {
    this.menuItemsChange.emit(
      this.menuItemsToDisplay.map((x) => x.originalItem),
    );
  }
}
