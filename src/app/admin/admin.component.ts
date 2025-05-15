import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { MatIconModule } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { DragDropModule, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { AdminMenuItemComponent } from "app/core/admin/admin-menu-item/admin-menu-item.component";
import { MatTooltip } from "@angular/material/tooltip";

/** UI to edit Menu Items (display content only and not interacting with the database) */
@Component({
  selector: "app-admin",
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MenuItemComponent,
    MatIconModule,
    MatIconButton,
    FaIconComponent,
    DragDropModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatButton,
    MatTooltip
  ],
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
})
export class AdminComponent {
  @Input() menuItems: MenuItem[];

  constructor(private dialog: MatDialog) {}

  // Remove an item from the menu
  removeMenuItem(index: number): void {
    if (index > -1) {
      this.menuItems.splice(index, 1);
    }
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
      }
    });
  }

  // Handle drag-and-drop sorting
  drop(event: CdkDragDrop<MenuItem[]>): void {
    moveItemInArray(this.menuItems, event.previousIndex, event.currentIndex);
  }

  save(): void {
    // TODO: Persist or emit the updated menuItems
    console.log("Save clicked:", this.menuItems);
  }

  cancel(): void {
    console.log("Changes cancelled");
    // TODO: Reset to initial state if needed
  }
}

