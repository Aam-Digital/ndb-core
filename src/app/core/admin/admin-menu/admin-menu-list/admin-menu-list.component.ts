import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { EntityMenuItem, MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { AdminMenuItemComponent } from "app/core/admin/admin-menu/admin-menu-item/admin-menu-item.component";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { firstValueFrom } from "rxjs";

/** UI to edit Menu Items (display content only and not interacting with the database) */
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
    FaIconComponent,
    MatButton,
  ],
  templateUrl: "./admin-menu-list.component.html",
  styleUrls: ["./admin-menu-list.component.scss"],
})
export class AdminMenuListComponent {
  /**
   * Menu items (as stored in the config) to edit.
   */
  @Input() set menuItems(value: (MenuItem | EntityMenuItem)[]) {
    this._menuItems = JSON.parse(JSON.stringify(value ?? [])); // deep clone to avoid direct mutation

    this.menuItemsToDisplay = (this._menuItems ?? []).map((item) =>
      this.menuService.generateMenuItemForEntityType(item),
    );
  }
  get menuItems(): (MenuItem | EntityMenuItem)[] {
    return this._menuItems;
  }
  private _menuItems: (MenuItem | EntityMenuItem)[] = [];

  @Output() menuItemsChange = new EventEmitter<MenuItem[]>();

  /**
   * Menu items parsed to standard MenuItem format for the preview UI.
   */
  menuItemsToDisplay: MenuItem[] = [];

  constructor(
    private dialog: MatDialog,
    private menuService: MenuService,
  ) {}

  // Remove an item from the menu
  removeMenuItem(index: number): void {
    if (index > -1) {
      this.menuItems.splice(index, 1);
    }

    this.menuItemsChange.emit(this.menuItems);
  }

  // Open dialog to edit a menu item
  async editMenuItem(index: number) {
    const updatedItem = await this.openEditDialog(this.menuItems[index]);

    if (updatedItem) {
      this.menuItems[index] = updatedItem;
      this.menuItemsChange.emit(this.menuItems);
    }
  }

  // Add a new menu item
  addNewMenuItem() {
    // TODO: refactor this to use the same dialog as edit

    const dialogRef = this.dialog.open(AdminMenuItemComponent, {
      height: "400px",
      width: "600px",
      data: {
        item: {}, // Empty object for a new item
        index: null,
      },
    });

    dialogRef.afterClosed().subscribe((newItem: MenuItem) => {
      if (newItem) {
        this.menuItems.push(newItem); // Add the new item to the list
        this.menuItemsChange.emit(this.menuItems);
      }
    });
  }

  private async openEditDialog(item?: MenuItem): Promise<MenuItem | undefined> {
    const dialogRef = this.dialog.open(AdminMenuItemComponent, {
      width: "600px",
      data: {
        item: { ...(item ?? {}) }, // clone to avoid direct mutation
        isNew: !item,
      },
    });

    return firstValueFrom(dialogRef.afterClosed());
  }

  // Handle drag-and-drop sorting
  drop(event: CdkDragDrop<MenuItem[]>): void {
    moveItemInArray(this.menuItems, event.previousIndex, event.currentIndex);
    this.menuItemsChange.emit(this.menuItems);
  }
}

