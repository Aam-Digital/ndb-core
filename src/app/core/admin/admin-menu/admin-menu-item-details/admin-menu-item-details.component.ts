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
import { AdminIconComponent } from "app/admin-icon-input/admin-icon-input.component";
import { ConfigService } from "app/core/config/config.service";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "app/core/config/dynamic-routing/view-config.interface";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";

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
    AdminIconComponent,
    MatDialogModule,
    EntityTypeSelectComponent,
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
}>(MAT_DIALOG_DATA);

  item: MenuItem | EntityMenuItem;
  availableRoutes: { value: string; label: string }[];
  isNew: boolean;

  constructor() {
    const data = this.data;

    this.item = data.item;
    this.isNew = data.isNew;
  }

  ngOnInit(): void {
    this.availableRoutes = this.loadAvailableRoutes();
  }

  private loadAvailableRoutes(): { value: string; label: string }[] {
    const allConfigs: ViewConfig[] =
      this.configService.getAllConfigs<ViewConfig>(PREFIX_VIEW_CONFIG);
    return allConfigs
      .filter((view) => !view._id.includes("/:id")) // skip details views (with "/:id" placeholder)
      .map((view) => {
        const id = view._id.replace(PREFIX_VIEW_CONFIG, "/");
        const label = view.config?.entityType?.trim() || view.component || id;
        return { value: id, label };
      });
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
    }

    this.dialogRef.close(this.item);
  }

  cancel() {
    this.dialogRef.close();
  }
}
