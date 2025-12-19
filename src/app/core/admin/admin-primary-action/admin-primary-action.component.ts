import { Component, inject } from "@angular/core";
import { MenuService } from "../../ui/navigation/menu.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MenuItemFormComponent } from "../admin-menu/menu-item-form/menu-item-form.component";
import { ConfigService } from "../../config/config.service";
import { PrimaryActionConfig } from "./primary-action-config";
import { PrimaryActionService } from "./primary-action.service";

import { EntityTypeSelectComponent } from "../../entity/entity-type-select/entity-type-select.component";
import { EntityConstructor } from "../../entity/model/entity";
import { MenuItem } from "../../ui/navigation/menu-item";
import { FormsModule } from "@angular/forms";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";
import { HintBoxComponent } from "../../common-components/hint-box/hint-box.component";

@Component({
  selector: "app-admin-primary-action",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MenuItemFormComponent,
    EntityTypeSelectComponent,
    FormsModule,
    ViewTitleComponent,
    ViewActionsComponent,
    HintBoxComponent,
  ],
  templateUrl: "./admin-primary-action.component.html",
  styleUrls: ["./admin-primary-action.component.scss"],
})
export class AdminPrimaryActionComponent {
  private readonly configService = inject(ConfigService);
  private readonly menuService = inject(MenuService);
  private readonly primaryActionService = inject(PrimaryActionService);

  private get currentConfig(): PrimaryActionConfig {
    return this.primaryActionService.getCurrentConfig();
  }

  menuItem: MenuItem;

  routeOptions: { value: string; label: string }[] = [];

  actionType: "createEntity" | "navigate";
  entityType: string;

  private initialConfigString: string;

  constructor() {
    this.routeOptions = this.menuService.loadAvailableRoutes();
    this.initForm();
  }

  private initForm() {
    const current = this.currentConfig;
    this.actionType = current.actionType;
    this.entityType = current.entityType ?? "Note";
    // Create a completely new object reference to trigger change detection
    this.menuItem = JSON.parse(
      JSON.stringify({
        label: "",
        icon: current.icon,
        link: current.route ?? "",
      }),
    );
    this.initialConfigString = JSON.stringify(this.getCurrentFormState());
  }

  get hasChanges(): boolean {
    return (
      JSON.stringify(this.getCurrentFormState()) !== this.initialConfigString
    );
  }

  private getCurrentFormState() {
    return {
      actionType: this.actionType,
      entityType: this.entityType,
      icon: this.menuItem.icon,
      route: this.menuItem.link,
    };
  }

  // Only show user-facing entities that support dialog-based creation
  entityTypeOptions: EntityConstructor[] =
    this.primaryActionService.getEntityTypeOptions();

  get showEntityType(): boolean {
    return this.actionType === "createEntity";
  }

  onEntityTypeChange(value: string | string[]) {
    this.entityType = Array.isArray(value) ? value[0] : value;
  }

  save() {
    const config: PrimaryActionConfig = {
      icon: this.menuItem.icon,
      actionType: this.actionType,
      entityType:
        this.actionType === "createEntity" ? this.entityType : undefined,
      route: this.actionType === "navigate" ? this.menuItem.link : undefined,
    };
    const current = this.configService.exportConfig(true) as Record<
      string,
      unknown
    >;
    current["primaryAction"] = config;
    this.configService.saveConfig(current);

    // Reset change tracking after save
    this.initialConfigString = JSON.stringify(this.getCurrentFormState());
  }

  cancel() {
    // Reset form to current saved configuration
    this.initForm();
  }
}
