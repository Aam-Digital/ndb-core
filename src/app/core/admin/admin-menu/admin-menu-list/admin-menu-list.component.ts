import {
  Component,
  EventEmitter,
  Input,
  Output
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
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButton, MatIconButton } from "@angular/material/button";
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
    MatButton,
    MatIconModule,
  ],
  templateUrl: "./admin-menu-list.component.html",
  styleUrls: [
    "./admin-menu-list.component.scss",
    "../../../ui/navigation/menu-item/menu-item.component.scss",
  ],
})
export class AdminMenuListComponent {
  @Input() showAddNew: boolean = true;
  @Input() connectedDropLists: string[] = []; // For nested connections

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

  menuItemsToDisplay: {
    originalItem: MenuItem | EntityMenuItem;
    itemToDisplay: MenuItem;
  }[] = [];

  listId = `list-${Math.random().toString(36).substr(2, 9)}`; // Unique ID

  constructor(
    private dialog: MatDialog,
    private menuService: MenuService,
  ) {}

  getConnectedDropLists(): string[] {
    return [this.listId, ...(this.connectedDropLists ?? [])];
  }

  removeMenuItem(index: number): void {
    if (index > -1) {
      this.menuItemsToDisplay.splice(index, 1);
    }
    this.emitChange();
  }

  async editMenuItem(item: MenuItem) {
    const updatedItem = await this.openEditDialog(item);
    if (updatedItem) {
      Object.assign(item, updatedItem);
      this.emitChange();
    }
  }

  async addNewMenuItem() {
    const newItem = await this.openEditDialog(undefined);
    if (newItem) {
      this.menuItemsToDisplay.push({
        originalItem: { ...newItem },
        itemToDisplay: this.menuService.generateMenuItemForEntityType(newItem),
      });
      this.emitChange();
    }
  }

  private async openEditDialog(item?: MenuItem): Promise<MenuItem | undefined> {
    const dialogRef = this.dialog.open(AdminMenuItemComponent, {
      width: "600px",
      data: {
        item: { ...(item ?? {}) },
        isNew: !item,
      },
    });
    return firstValueFrom(dialogRef.afterClosed());
  }

  /**
   * Handles drop event for the main list (for promotion or reordering).
   * If dropped into the root, it's promoted to top-level.
   */
  drop(event: CdkDragDrop<any[]>, parentItem: MenuItem | null) {
    const previousList = event.previousContainer.data;
    const currentList = event.container.data;

    if (event.previousContainer === event.container) {
      // Reorder within the same list
      moveItemInArray(currentList, event.previousIndex, event.currentIndex);
    } else {
      // Transfer between lists (promotion/demotion)
      transferArrayItem(previousList, currentList, event.previousIndex, event.currentIndex);
    }

    // If dropping into a submenu, update subMenu property of parent
    if (parentItem) {
      parentItem.subMenu = currentList.map((x: any) => x.originalItem || x);
      this.emitChange();
    } else {
      // Dropping to root: update top-level
      this.menuItemsChange.emit(this.menuItemsToDisplay.map(x => x.originalItem));
    }
  }

  /**
   * Handles drop event ON a menu item (to make it a child/submenu item).
   * Used to demote a main menu item to a submenu.
   */
  dropOnItem(event: CdkDragDrop<any[]>, targetIndex: number) {
    // Only handle if dragging from another list
    if (event.previousContainer === event.container) return;

    const draggedItem = event.previousContainer.data[event.previousIndex];
    const targetItem = this.menuItemsToDisplay[targetIndex].originalItem;

    // Prevent making an item a child of itself or its descendants
    if (this.isDescendant(draggedItem.originalItem, targetItem) || draggedItem.originalItem === targetItem) {
      return;
    }

    // Remove item from previous list
    event.previousContainer.data.splice(event.previousIndex, 1);

    // Create subMenu if missing
    if (!targetItem.subMenu) targetItem.subMenu = [];

    // Add as child
    targetItem.subMenu.push(draggedItem.originalItem);

    this.emitChange();
  }

  /**
   * Helper to prevent circular nesting.
   * Returns true if 'item' is a descendant of 'potentialAncestor'.
   */
  private isDescendant(item: MenuItem, potentialAncestor: MenuItem): boolean {
    if (!potentialAncestor.subMenu) return false;
    for (const child of potentialAncestor.subMenu) {
      if (child === item) return true;
      if (this.isDescendant(item, child)) return true;
    }
    return false;
  }

  submenuChanged(item: MenuItem, newSubmenu: MenuItem[]) {
    item.subMenu = newSubmenu;
    this.emitChange();
  }

  private emitChange() {
    this.menuItemsChange.emit(this.menuItemsToDisplay.map(x => x.originalItem));
  }
}