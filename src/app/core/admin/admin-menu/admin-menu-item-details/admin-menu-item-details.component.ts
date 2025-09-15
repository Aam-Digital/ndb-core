import { Component, OnInit, inject } from "@angular/core";
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
import { ConfigService } from "app/core/config/config.service";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "app/core/config/dynamic-routing/view-config.interface";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";
import { MenuItemFormComponent } from "#src/app/menu-item-form/menu-item-form.component";

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
  private configService = inject(ConfigService);
  dialogRef = inject<MatDialogRef<AdminMenuItemDetailsComponent>>(MatDialogRef);
  data = inject<{
    item: MenuItem;
    isNew?: boolean;
    itemType?: string;
    excludeNavigationItems?: boolean;
  }>(MAT_DIALOG_DATA);

  item: MenuItem | EntityMenuItem;
  availableRoutes: { value: string; label: string }[];
  isNew: boolean;
  itemType: string;
  excludeNavigationItems: boolean;

  constructor() {
    const data = this.data;

    this.item = data.item;
    this.isNew = data.isNew;
    this.itemType = data.itemType || "Menu Item";
    this.excludeNavigationItems = data.excludeNavigationItems || false;
  }

  ngOnInit(): void {
    this.availableRoutes = this.loadAvailableRoutes();
  }

  private loadAvailableRoutes(): { value: string; label: string }[] {
    const allConfigs: ViewConfig[] =
      this.configService.getAllConfigs<ViewConfig>(PREFIX_VIEW_CONFIG);

    let availableViews = allConfigs.filter(
      (view) => !view._id.includes("/:id"),
    ); // skip details views (with "/:id" placeholder)

    // Only exclude routes when creating shortcuts (not main navigation menu)
    if (this.excludeNavigationItems && this.itemType === "Shortcut") {
      const navigationRoutes = this.getNavigationMenuRoutes();
      availableViews = availableViews.filter((view) => {
        const route = view._id.replace(PREFIX_VIEW_CONFIG, "/");
        return !navigationRoutes.includes(route);
      });
    }

    return availableViews.map((view) => {
      const id = view._id.replace(PREFIX_VIEW_CONFIG, "/");
      const label = view.config?.entityType?.trim() || view.component || id;
      return { value: id, label };
    });
  }

  private getNavigationMenuRoutes(): string[] {
    try {
      const navigationConfig = this.configService.getConfig<{
        items: MenuItem[];
      }>("navigationMenu");
      const routes: string[] = [];

      const isEntityMenuItem = (
        item: MenuItem | EntityMenuItem,
      ): item is EntityMenuItem => "entityType" in item;

      const extractRoutes = (items: (MenuItem | EntityMenuItem)[]) => {
        items?.forEach((item) => {
          if (item.link) {
            routes.push(item.link);
          }
          if (isEntityMenuItem(item) && item.entityType) {
            routes.push(`/${item.entityType.toLowerCase()}`);
          }
          if (item.subMenu) {
            extractRoutes(item.subMenu);
          }
        });
      };

      extractRoutes(navigationConfig?.items || []);
      return routes;
    } catch (error) {
      console.warn("Could not load navigation menu config:", error);
      return [];
    }
  }

  onEntityTypeSelected(entityType: string | string[]) {
    (this.item as EntityMenuItem).entityType = entityType as string; // multi is set to false, so this is always a string
  }

  save() {
    if ((this.item as EntityMenuItem).entityType) {
      // remove unused hidden properties that may still be left in the item
      delete this.item.label;
      delete this.item.icon;
      delete this.item.link;
    } else if (!this.item.link) {
      // optionally surface validation in UI; minimally, do not close
      return;
    }

    this.dialogRef.close(this.item);
  }

  cancel() {
    this.dialogRef.close();
  }
}
