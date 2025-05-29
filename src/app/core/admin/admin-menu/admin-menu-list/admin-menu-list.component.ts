import { Component, EventEmitter, Input, Output } from "@angular/core";
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
      return { originalItem: item, itemToDisplay: displayItem };
    });
  }

  @Output() readonly menuItemsChange = new EventEmitter<MenuItem[]>();

  menuItemsToDisplay: {
    originalItem: MenuItem | EntityMenuItem;
    itemToDisplay: MenuItem;
  }[] = [];

  readonly listId = `list-${Math.random().toString(36).substr(2, 9)}`;

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
      this.emitChange();
    }
  }

  async editMenuItem(item: MenuItem) {
    const updatedItem = await this.openEditDialog(item);
    if (updatedItem) {
      Object.assign(item, updatedItem);
      this.emitChange();
    }
  }

  async addNewMenuItem() {
    const newItem = await this.openEditDialog();
    if (newItem) {
      this.menuItemsToDisplay.push({
        originalItem: newItem,
        itemToDisplay: this.menuService.generateMenuItemForEntityType(newItem),
      });
      this.emitChange();
    }
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

  drop(event: CdkDragDrop<any[]>, parentItem: MenuItem | null) {
    const previousList = event.previousContainer.data;
    const currentList = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(currentList, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        previousList,
        currentList,
        event.previousIndex,
        event.currentIndex,
      );
      this.removeFromSubmenu(
        event.previousContainer.data[event.previousIndex],
        this.menuItemsToDisplay.map((x) => x.originalItem),
      );
    }

    if (parentItem) {
      parentItem.subMenu = currentList.map((x: any) => x.originalItem || x);
      this.emitChange();
    } else {
      this.emitChange();
    }
  }

  /**
   * Removes an item from its parent sub-menu structure.
   */
  private removeFromSubmenu(item: MenuItem, tree: MenuItem[]): boolean {
    for (let i = 0; i < tree.length; i++) {
      const current = tree[i];
      if (current.subMenu) {
        const index = current.subMenu.indexOf(item);
        if (index !== -1) {
          current.subMenu.splice(index, 1);
          return true;
        }
        if (this.removeFromSubmenu(item, current.subMenu)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Handles dropping an item onto another item in the list.
   * This allows for nesting items within each other.
   */
  // todo: right now this is not getting called when dropping an item on another item
  dropOnItem(event: CdkDragDrop<any[]>, targetIndex: number) {
    if (event.previousContainer === event.container) return;

    const draggedItem = event.previousContainer.data[event.previousIndex];
    const targetItem = this.menuItemsToDisplay[targetIndex].originalItem;

    if (
      this.isDescendant(draggedItem.originalItem, targetItem) ||
      draggedItem.originalItem === targetItem
    ) {
      return;
    }

    event.previousContainer.data.splice(event.previousIndex, 1);

    if (!targetItem.subMenu) targetItem.subMenu = [];
    targetItem.subMenu.push(draggedItem.originalItem);

    this.emitChange();
  }

  private isDescendant(item: MenuItem, potentialAncestor: MenuItem): boolean {
    if (!potentialAncestor.subMenu) return false;
    for (const child of potentialAncestor.subMenu) {
      if (child === item || this.isDescendant(item, child)) return true;
    }
    return false;
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
