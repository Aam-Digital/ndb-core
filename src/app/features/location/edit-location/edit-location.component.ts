import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { GeoLocation } from "../geo-location";
import { LocationInputComponent } from "../location-input/location-input.component";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EditComponent } from "../../../core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";

/**
 * Wrapper of LocationInput for use as an EditComponent.
 * (this should become obsolete after we refactor all EditComponents to be implemented as FormControls)
 */
@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LocationInputComponent, ReactiveFormsModule, MatTooltipModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditLocationComponent },
  ],
  styleUrls: ["./edit-location.component.scss"],
})
export class EditLocationComponent extends CustomFormControlDirective<GeoLocation> implements EditComponent {
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<GeoLocation> {
    return this.ngControl.control as FormControl<GeoLocation>;
  }
}
