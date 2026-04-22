import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MatListModule } from "@angular/material/list";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { Angulartics2Module } from "angulartics2";
import { MenuItem } from "../menu-item";
import { MatMenuModule } from "@angular/material/menu";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-menu-item",
  templateUrl: "./menu-item.component.html",
  styleUrls: ["./menu-item.component.scss"],
  imports: [
    MatListModule,
    FaIconComponent,
    FaDynamicIconComponent,
    RouterLink,
    Angulartics2Module,
    MatMenuModule,
  ],
  standalone: true,
})
export class MenuItemComponent {
  /**
   * The menu item to be displayed.
   */
  item = input.required<MenuItem>();

  /**
   * The menu item link that is currently displayed in the app
   * in order to highlight the active menu.
   */
  activeLink = input<string>();

  /**
   * The path portion of item.link, without query parameters.
   * e.g. "/user?type=X" → "/user"
   */
  linkPath = computed(() => this.item().link?.split("?")[0]);

  /**
   * The query parameters parsed from item.link, if any.
   * e.g. "/user?type=X" → { type: "X" }
   */
  linkQueryParams = computed((): Record<string, string> | undefined => {
    const qs = this.item().link?.split("?")[1];
    if (!qs) return undefined;
    const params: Record<string, string> = {};
    new URLSearchParams(qs).forEach((value, key) => (params[key] = value));
    return params;
  });

  isExpanded: boolean = false;

  toggleSubMenu(): void {
    this.isExpanded = !this.isExpanded;
  }

  hasSubMenu(item: MenuItem): boolean {
    return !!item.subMenu && item.subMenu.length > 0;
  }
}
