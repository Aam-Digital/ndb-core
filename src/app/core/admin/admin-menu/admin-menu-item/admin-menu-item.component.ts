import {
  Component,
  input,
  computed,
  inject,
  model,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { EntityMenuItem, MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { firstValueFrom } from "rxjs";
import { AdminMenuItemDetailsComponent } from "../admin-menu-item-details/admin-menu-item-details.component";
import {
  isManualItemWithoutLink,
  MenuItemForAdminUi,
} from "../menu-item-for-admin-ui";
import { MatNavList } from "@angular/material/list";
import { MatIconButton } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Display and edit a single menu item in the admin interface.
 *
 * Nesting and drag & drop are handled by the surrounding
 * {@link MenuItemListEditorComponent}, which renders the whole (nested) menu as one flat list.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-menu-item",
  imports: [
    MatNavList,
    MenuItemComponent,
    FaIconComponent,
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

  /** whether this item has nested sub-items (which are rows of their own in the editor) */
  hasSubItems = input<boolean>(false);

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
    return item ? isManualItemWithoutLink(item) && !this.hasSubItems() : false;
  });

  /** Whether entity type links are allowed (false for shortcuts, true for admin menu) */
  allowEntityLinks = input<boolean>(true);

  deleteItem = output<MenuItemForAdminUi>();

  onDelete(item: MenuItemForAdminUi): void {
    this.deleteItem.emit(item);
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
        allowEntityLinks: this.allowEntityLinks(),
      },
    });
    return firstValueFrom(dialogRef.afterClosed());
  }
}
