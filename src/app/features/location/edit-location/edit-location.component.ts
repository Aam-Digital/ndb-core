import {
  Component,
  inject,
  Input,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { filter, map } from "rxjs/operators";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { EditComponent } from "../../../core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { GeoLocation } from "../geo-location";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";

/**
 * Input to select and view an address on a map.
 */
@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  styleUrls: [
    "./edit-location.component.scss",
    "../../../core/common-components/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  //changeDetection: ChangeDetectionStrategy.OnPush, // disabled to update results from dialog
  imports: [
    FormsModule,
    MatInput,
    MatIconButton,
    FaIconComponent,
    MatTooltip,
    ReactiveFormsModule,
    MatTooltipModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditLocationComponent },
  ],
})
export class EditLocationComponent
  extends CustomFormControlDirective<GeoLocation>
  implements EditComponent
{
  private readonly dialog = inject(MatDialog);

  @Input() formFieldConfig?: FormFieldConfig;

  /**
   * Automatically run an address lookup when the user leaves the input field.
   */
  @Input() autoLookup = true;

  override onContainerClick() {
    if (!this._disabled) {
      this.openMap();
    }
  }

  openMap() {
    const config: MapPopupConfig = {
      selectedLocation: this.value,
      disabled: this._disabled,
    };

    const ref = this.dialog.open(MapPopupComponent, {
      width: "90%",
      height: "95vh",
      autoFocus: ".address-search-input",
      restoreFocus: false,
      data: config,
    });

    if (!this._disabled) {
      ref
        .afterClosed()
        .pipe(
          filter((result: GeoLocation[] | undefined) => {
            return Array.isArray(result);
          }),
          map((result: GeoLocation[]) => result[0]),
          filter(
            (result: GeoLocation | undefined) =>
              JSON.stringify(result) !== JSON.stringify(this.value),
          ), // nothing changed, skip
        )
        .subscribe((result: GeoLocation) => (this.value = result));
    }
  }
}
