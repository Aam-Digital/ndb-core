import {
  Component,
  ChangeDetectionStrategy,
  effect,
  input,
  linkedSignal,
} from "@angular/core";
import { FormsModule, FormControl } from "@angular/forms";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityTypeSelectComponent } from "../../../../core/entity/entity-type-select/entity-type-select.component";
import { EntityFieldSelectComponent } from "../../../../core/entity/entity-field-select/entity-field-select.component";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { EntityRemoteCountDashboardConfig } from "../entity-remote-count-dashboard/entity-remote-count-dashboard.component";

@DynamicComponent("EntityRemoteCountDashboardSettings")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-remote-count-dashboard-settings",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    EntityTypeSelectComponent,
    EntityFieldSelectComponent,
    FaIconComponent,
  ],
  templateUrl: "./entity-remote-count-dashboard-settings.component.html",
  styleUrls: ["./entity-remote-count-dashboard-settings.component.scss"],
})
export class EntityRemoteCountDashboardSettingsComponent {
  formControl = input.required<FormControl<EntityRemoteCountDashboardConfig>>();

  entityType = linkedSignal(() => this.formControl().value?.entityType);
  groupBy = linkedSignal(() => this.formControl().value?.groupBy);

  constructor() {
    effect(() => {
      this.formControl().setValue({
        entityType: this.entityType(),
        groupBy: this.groupBy(),
      });
    });
  }
}
