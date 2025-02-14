import { MatMenuTrigger } from "@angular/material/menu";

/**
 * Close the mat-menu of the given menu trigger
 * and stop propagation of the event to avoid closing parent menus as well.
 * @param menu
 * @param event
 */
export function closeOnlySubmenu(menu: MatMenuTrigger, event: MouseEvent) {
  menu.closeMenu();
  event.stopPropagation();
}
