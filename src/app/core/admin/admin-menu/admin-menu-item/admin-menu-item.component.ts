import {
  Component,
  Input,
  computed,
  inject,
  model,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { EntityMenuItem, MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { firstValueFrom } from "rxjs";
import { AdminMenuItemDetailsComponent } from "../admin-menu-item-details/admin-menu-item-details.component";
import {
  hasNoLinkAndNoSubItems,
  MenuItemForAdminUi,
} from "../menu-item-for-admin-ui";
import { MatNavList } from "@angular/material/list";
import { MatIconButton } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Display and edit a menu item in the admin interface,
 * including recursively editing and drag&drop of subMenu items.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-menu-item",
  standalone: true,
  imports: [
    MatNavList,
    MenuItemComponent,
    FaIconComponent,
    DragDropModule,
    MatFormFieldModule,
    FormsModule,
    MatIconButton,
    MatTooltipModule,
  ],
  templateUrl: "./admin-menu-item.component.html",
  styleUrls: [
    "./admin-menu-item.component.scss",
    "../../../ui/navigation/menu-item/menu-item.component.scss",
  ],
})
export class AdminMenuItemComponent {
  private readonly dialog = inject(MatDialog);
  private readonly menuService = inject(MenuService);

  item = model.required<MenuItemForAdminUi>();

  itemToDisplay = computed<MenuItem>(() => {
    const item = this.item();
    if (!item) {
      return undefined;
    }
    const plainItem = this.menuService.generateMenuItemForEntityType(item);
    delete plainItem.link;
    delete plainItem.subMenu;
    return plainItem;
  });

  /**
   * True when the item has no link and no sub-items,
   * meaning clicking it will have no visible effect.
   */
  hasNoLinkWarning = computed(() => {
    const item = this.item();
    return item ? hasNoLinkAndNoSubItems(item) : false;
  });

  @Input() connectedTo: string[];

  /** Whether entity type links are allowed (false for shortcuts, true for admin menu) */
  @Input() allowEntityLinks: boolean = true;

  /** Whether sub-menus are allowed for this item type */
  @Input() allowSubMenu: boolean = true;

  itemDrop = output<CdkDragDrop<MenuItemForAdminUi[]>>();
  deleteItem = output<MenuItemForAdminUi>();

  removeSubItem(subItem: MenuItemForAdminUi): void {
    this.item.set({
      ...this.item(),
      subMenu: [...this.item().subMenu.filter((i) => i !== subItem)],
    });
  }

  onSubItemChange(updatedSubItem: MenuItemForAdminUi) {
    this.item.set({
      ...this.item(),
      subMenu: this.item().subMenu.map((sub) =>
        sub.uniqueId === updatedSubItem.uniqueId ? updatedSubItem : sub,
      ),
    });
  }

  onDelete(item: MenuItemForAdminUi): void {
    this.deleteItem.emit(item);
  }

  onDragDrop(event: CdkDragDrop<MenuItemForAdminUi[]>) {
    this.itemDrop.emit(event);
  }

  async editMenuItem(item: MenuItemForAdminUi) {
    const updatedItem = await this.openEditDialog(item);
    if (updatedItem) {
      const mergedItem = { ...item, ...updatedItem };
      if ("entityType" in item && !("entityType" in updatedItem)) {
        delete (mergedItem as unknown as EntityMenuItem).entityType;
      }
      // If link was explicitly removed in the dialog (noLinkMode), ensure it is
      // not re-introduced from the original item by the spread above.
      if ("link" in item && !("link" in updatedItem)) {
        delete mergedItem.link;
      }

      this.item.set(mergedItem);
    }
  }

  private async openEditDialog(
    item: MenuItemForAdminUi,
  ): Promise<MenuItemForAdminUi | undefined> {
    const dialogRef = this.dialog.open(AdminMenuItemDetailsComponent, {
      width: "600px",
      data: {
        item: item ? { ...item } : {},
        allowEntityLinks: this.allowEntityLinks,
      },
    });
    return firstValueFrom(dialogRef.afterClosed());
  }
}
