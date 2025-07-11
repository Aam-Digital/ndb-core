import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../core/entity/default-datatype/edit-component";
import { GeoLocation } from "../geo-location";
import { LocationInputComponent } from "../location-input/location-input.component";
import { MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { ErrorHintComponent } from "../../../core/common-components/error-hint/error-hint.component";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Wrapper of LocationInput for use as an EditComponent.
 * (this should become obsolete after we refactor all EditComponents to be implemented as FormControls)
 */
@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  imports: [
    LocationInputComponent,
    MatFormField,
    MatLabel,
    MatError,
    ReactiveFormsModule,
    ErrorHintComponent,
    MatTooltipModule,
  ],
  styleUrls: ["./edit-location.component.scss"],
})
export class EditLocationComponent extends EditComponent<GeoLocation> {}
