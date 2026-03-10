import { Component, inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { EntityMenuItem, MenuItem } from "app/core/ui/navigation/menu-item";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";
import { MenuItemFormComponent } from "#src/app/core/admin/admin-menu/menu-item-form/menu-item-form.component";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "#src/app/core/config/dynamic-routing/view-config.interface";
import { ConfigService } from "#src/app/core/config/config.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";

/**
 * Dialog component to edit a single menu item's details.
 */
@Component({
  selector: "app-admin-menu-item-details",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    EntityTypeSelectComponent,
    MenuItemFormComponent,
  ],
  templateUrl: "./admin-menu-item-details.component.html",
  styleUrls: ["./admin-menu-item-details.component.scss"],
})
export class AdminMenuItemDetailsComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  dialogRef = inject<MatDialogRef<AdminMenuItemDetailsComponent>>(MatDialogRef);
  data = inject<{
    item: MenuItem;
    isNew?: boolean;
    allowEntityLinks?: boolean;
  }>(MAT_DIALOG_DATA);

  item: MenuItem | EntityMenuItem;
  availableRoutes: { value: string; label: string }[];
  isNew: boolean;
  /** Whether entity type links are allowed (false for shortcuts, true for admin menu) */
  allowEntityLinks: boolean;

  /** Whether this item is being saved without a link (parent section only). */
  noLinkMode = false;

  constructor() {
    const data = this.data;

    this.item = data.item;
    this.isNew = data.isNew;
    this.allowEntityLinks = data.allowEntityLinks ?? true;

    // For existing items that already have no link, default the toggle to ON
    if (
      !this.isNew &&
      !this.item.link &&
      !(this.item as EntityMenuItem).entityType
    ) {
      this.noLinkMode = true;
    }
  }

  ngOnInit(): void {
    this.availableRoutes = this.loadAvailableRoutes();
  }

  private loadAvailableRoutes(): { value: string; label: string }[] {
    const allConfigs: ViewConfig[] =
      this.configService.getAllConfigs<ViewConfig>(PREFIX_VIEW_CONFIG);

    const availableViews = allConfigs.filter(
      (view) => !view._id.includes("/:id"),
    ); // skip details views (with "/:id" placeholder)

    return availableViews.map((view) => {
      const id = view._id.replace(PREFIX_VIEW_CONFIG, "/");
      const label = view.config?.entityType?.trim() || view.component || id;
      return { value: id, label };
    });
  }

  onEntityTypeSelected(entityType: string | string[]) {
    const entityTypeValue = entityType as string; // multi is set to false, so this is always a string

    if (entityTypeValue?.trim()) {
      (this.item as EntityMenuItem).entityType = entityTypeValue.trim();
    } else {
      // Clear entity type when empty or null is selected
      delete (this.item as EntityMenuItem).entityType;
    }
  }

  async onNoLinkModeChange(enable: boolean) {
    if (enable && this.item.link?.trim()) {
      // Warn before removing an existing link
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:Confirmation title for removing link from menu item:Remove link?`,
        $localize`:Confirmation message for removing link from menu item:This item currently has a link. Turning this on will remove it. Do you still want to proceed?`,
      );
      if (!confirmed) {
        return;
      }
      delete this.item.link;
    }
    this.noLinkMode = enable;
  }

  save() {
    const entityMenuItem = this.item as EntityMenuItem;
    const hasValidEntityType = entityMenuItem.entityType?.trim();

    if (hasValidEntityType) {
      // For entity type items, remove manual properties
      delete this.item.label;
      delete this.item.icon;
      delete this.item.link;
      entityMenuItem.entityType = hasValidEntityType;
    } else {
      // For manual items, remove entity type property
      delete entityMenuItem.entityType;

      if (!this.item.link?.trim() && !this.noLinkMode) {
        // Validation: manual items require a link unless noLinkMode is active
        return;
      }

      if (this.noLinkMode) {
        // Ensure link is fully absent (not an empty string)
        delete this.item.link;
      }
    }

    this.dialogRef.close(this.item);
  }

  cancel() {
    this.dialogRef.close();
  }
}
