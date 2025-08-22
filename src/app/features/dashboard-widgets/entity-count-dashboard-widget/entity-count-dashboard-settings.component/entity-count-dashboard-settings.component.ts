import { Component, Input, OnInit } from "@angular/core";
import { FormsModule, FormControl } from "@angular/forms";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityTypeSelectComponent } from "../../../../core/entity/entity-type-select/entity-type-select.component";
import { EntityFieldSelectComponent } from "../../../../core/entity/entity-field-select/entity-field-select.component";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

export interface EntityCountDashboardConfig {
  entityType?: string;
  groupBy?: string[];
}

@DynamicComponent("EntityCountDashboardSettings")
@Component({
  selector: "app-entity-count-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    FormsModule,
    EntityTypeSelectComponent,
    EntityFieldSelectComponent,
    FaIconComponent,
  ],
  templateUrl: "./entity-count-dashboard-settings.component.html",
  styleUrls: ["./entity-count-dashboard-settings.component.scss"],
})
export class EntityCountDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<EntityCountDashboardConfig>;

  localConfig: EntityCountDashboardConfig;

  ngOnInit() {
    this.localConfig = {
      entityType: this.formControl.value?.entityType || "Child",
      groupBy:
        this.formControl.value?.groupBy &&
        this.formControl.value.groupBy.length > 0
          ? [...this.formControl.value.groupBy]
          : ["center", "gender"],
    };
  }

  onEntityTypeChange() {
    this.emitConfigChange();
  }

  onGroupByChange() {
    this.emitConfigChange();
  }

  private emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
