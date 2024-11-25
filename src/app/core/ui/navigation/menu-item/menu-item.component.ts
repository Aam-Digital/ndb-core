import { Component, Input } from "@angular/core";
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
  @Input() item: MenuItem; // Receives each individual menu item as input
  @Input() activeLink: string; // Receives the active link as input
  isExpanded: boolean = false;

  toggleSubMenu(): void {
    this.isExpanded = !this.isExpanded;
  }

  hasSubMenu(item: MenuItem): boolean {
    return !!item.subMenu && item.subMenu.length > 0;
  }

  // Method to check if a submenu item is active
  isSubMenuActive(item: MenuItem): boolean {
    return (
      item.link === this.activeLink || // check if the main item is active
      (item.subMenu &&
        item.subMenu.some((subItem) => subItem.link === this.activeLink)) // check if any submenu item is active
    );
  }
}
