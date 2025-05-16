import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { DragDropModule, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { AdminMenuItemComponent } from "app/core/admin/admin-menu/admin-menu-item/admin-menu-item.component";

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
    MatButton
  ],
  templateUrl: "./admin-menu-list.component.html",
  styleUrls: ["./admin-menu-list.component.scss"],
})
export class AdminMenuListComponent {
  @Input() menuItems: MenuItem[];
  @Output() menuItemsChange = new EventEmitter<MenuItem[]>();

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["menuItems"]) {
      // Deep clone the menuItems to avoid direct mutation
      this.menuItems = JSON.parse(JSON.stringify(this.menuItems));
    }
  }

  // Remove an item from the menu
  removeMenuItem(index: number): void {
    if (index > -1) {
      this.menuItems.splice(index, 1);
    }

    this.menuItemsChange.emit(this.menuItems);
  }

  // Open dialog to edit a menu item
  editMenuItem(index: number): void {
    const dialogRef = this.dialog.open(AdminMenuItemComponent, {
      height: '400px',
      width: '600px',
      data: {
        item: { ...this.menuItems[index] }, // clone to avoid direct mutation
        index
      }
    });

    dialogRef.afterClosed().subscribe((updatedItem: MenuItem) => {
      if (updatedItem) {
        this.menuItems[index] = updatedItem;
        this.menuItemsChange.emit(this.menuItems);
      }
    });
  }

  // Add a new menu item
  addNewMenuItem(): void {
    const dialogRef = this.dialog.open(AdminMenuItemComponent, {
      height: '400px',
      width: '600px',
      data: {
        item: {}, // Empty object for a new item
        index: null,
      }
    });

    dialogRef.afterClosed().subscribe((newItem: MenuItem) => {
      if (newItem) {
        this.menuItems.push(newItem); // Add the new item to the list
        this.menuItemsChange.emit(this.menuItems);
      }
    });
  }

  // Handle drag-and-drop sorting
  drop(event: CdkDragDrop<MenuItem[]>): void {
    moveItemInArray(this.menuItems, event.previousIndex, event.currentIndex);
    this.menuItemsChange.emit(this.menuItems);
  }
}

