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
  /**
   * The menu item to be displayed.
   */
  @Input() item: MenuItem;

  /**
   * The menu item link that is currently displayed in the app
   * in order to highlight the active menu.
   */
  @Input() activeLink: string;

  isExpanded: boolean = false;

  toggleSubMenu(): void {
    this.isExpanded = !this.isExpanded;
  }

  hasSubMenu(item: MenuItem): boolean {
    return !!item.subMenu && item.subMenu.length > 0;
  }
}
