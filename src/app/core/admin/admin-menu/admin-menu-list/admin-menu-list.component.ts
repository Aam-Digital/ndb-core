import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from "@angular/core";
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
import { MenuService } from "app/core/ui/navigation/menu.service";
import { firstValueFrom } from "rxjs";
import { AdminMenuItemComponent } from "../admin-menu-item/admin-menu-item.component";

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
  styleUrls: [
    "./admin-menu-list.component.scss",
    "../../../ui/navigation/menu-item/menu-item.component.scss",
  ],
})
export class AdminMenuListComponent {
  /**
   * Menu items (as stored in the config) to edit.
   */
  @Input() set menuItems(value: (MenuItem | EntityMenuItem)[]) {
    this.menuItemsToDisplay = (value ?? []).map((item) => {
      const displayItem = this.menuService.generateMenuItemForEntityType(item);
      delete displayItem.subMenu;
      return {
        originalItem: { ...item },
        itemToDisplay: displayItem,
      };
    });
  }

  @Output() menuItemsChange = new EventEmitter<MenuItem[]>();

  /**
   * Whether a button to add new menu items should be displayed to users.
   */
  @Input() showAddNew: boolean = true;

  /**
   * Menu items parsed to standard MenuItem format for the preview UI.
   */
  menuItemsToDisplay: {
    originalItem: MenuItem | EntityMenuItem;
    itemToDisplay: MenuItem;
  }[] = [];

  constructor(
    private dialog: MatDialog,
    private menuService: MenuService,
  ) {}

  // Remove an item from the menu
  removeMenuItem(index: number): void {
    if (index > -1) {
      this.menuItemsToDisplay.splice(index, 1);
    }

    this.emitChange();
  }

  // Open dialog to edit a menu item
  async editMenuItem(item: MenuItem) {
    const updatedItem = await this.openEditDialog(item);

    if (updatedItem) {
      Object.assign(item, updatedItem);
      this.emitChange();
    }
  }

  // Add a new menu item
  async addNewMenuItem() {
    const newItem = await this.openEditDialog(undefined);
    if (newItem) {
      this.menuItems.push(newItem); // Add the new item to the list
      this.emitChange();
    }
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
  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.menuItemsToDisplay,
      event.previousIndex,
      event.currentIndex,
    );
    this.emitChange();
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
