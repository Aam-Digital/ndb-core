import { Component } from "@angular/core";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { EditEntityArrayComponent } from "../../../core/entity-components/entity-select/edit-entity-array/edit-entity-array.component";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditAttendance")
@Component({
  selector: "app-edit-attendance",
  standalone: true,
  imports: [EditEntityArrayComponent],
  templateUrl: "./edit-attendance.component.html",
  styleUrls: ["./edit-attendance.component.scss"],
})
export class EditAttendanceComponent extends EditComponent<string[]> {
  entityName: string;

  onInitFromDynamicConfig(config: EditPropertyConfig<string[]>) {
    super.onInitFromDynamicConfig(config);
    this.entityName =
      config.formFieldConfig.additional || config.propertySchema.additional;
  }
}
