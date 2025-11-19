import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { MenuService } from "../../core/ui/navigation/menu.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MenuItemFormComponent } from "#src/app/menu-item-form/menu-item-form.component";
import { ConfigService } from "../config/config.service";
import { PrimaryActionConfig } from "../config/primary-action-config";
import { CommonModule } from "@angular/common";
import { EntityTypeSelectComponent } from "../entity/entity-type-select/entity-type-select.component";
import { MenuItem } from "../ui/navigation/menu-item";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-primary-action-config-form",
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MenuItemFormComponent,
    EntityTypeSelectComponent,
    FormsModule,
  ],
  templateUrl: "./primary-action-config-form.component.html",
  styleUrls: ["./primary-action-config-form.component.scss"],
})
export class PrimaryActionConfigFormComponent {
  private configService = inject(ConfigService);
  private menuService = inject(MenuService);

  private get defaultConfig(): PrimaryActionConfig {
    return {
      icon: "plus",
      actionType: "createEntity",
      entityType: "Note",
      route: "",
    };
  }

  private get currentConfig(): PrimaryActionConfig {
    return (
      this.configService.getConfig<PrimaryActionConfig>("primaryAction") ??
      this.defaultConfig
    );
  }

  menuItem: MenuItem = {
    label: "",
    icon: this.currentConfig.icon,
    link: this.currentConfig.route ?? "",
  };

  routeOptions = this.menuService.loadAvailableRoutes();

  actionType: "createEntity" | "navigate" = this.currentConfig.actionType;
  entityType: string = this.currentConfig.entityType ?? "Note";

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
    const current = this.configService.exportConfig(true) as any;
    current["primaryAction"] = config;
    this.configService.saveConfig(current);
    // TODO: Add success message/snackbar
  }
}
