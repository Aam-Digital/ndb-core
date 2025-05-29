import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule, NgForOf } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { Angulartics2Module } from "angulartics2";
import { MenuItem } from "../menu-item";
import { MatMenuModule } from "@angular/material/menu";

@Component({
  selector: "app-menu-item",
  templateUrl: "./menu-item.component.html",
  styleUrls: ["./menu-item.component.scss"],
  imports: [
    CommonModule,
    MatListModule,
    FaIconComponent,
    FaDynamicIconComponent,
    RouterLink,
    Angulartics2Module,
    NgForOf,
    MatMenuModule,
  ],
  standalone: true,
})
export class MenuItemComponent {
  /**
   * The menu item to be displayed.
   */
  @Input() item: MenuItem;

  /**
   * The menu item link that is currently displayed in the app
   * in order to highlight the active menu.
   */
  @Input() activeLink: string;

  @Input() adminMode = false;
  @Output() editRequest = new EventEmitter<void>();

  isExpanded: boolean = false;
  toggleSubMenu(): void {
    this.isExpanded = !this.isExpanded;
  }
  hasSubMenu(item: MenuItem): boolean {
    return !!item.subMenu && item.subMenu.length > 0;
  }
  onLabelClick(event: MouseEvent) {
    if (this.adminMode) {
      event.preventDefault();
      event.stopPropagation();
      this.editRequest.emit();
      return false;
    }
    return true;
  }

   onListItemClick(event: MouseEvent) {
    if (this.adminMode) {
      event.preventDefault();
      event.stopPropagation();
      this.editRequest.emit();
      return false;
    } else if (this.hasSubMenu(this.item)) {
      event.preventDefault();
      this.toggleSubMenu();
      return false;
    }
    // Else, allow navigation
    return true;
  }
}
