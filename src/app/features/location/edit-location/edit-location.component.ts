import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
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
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  styleUrls: [
    "./edit-location.component.scss",
    "../../../core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
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

  formFieldConfig = input<FormFieldConfig>();

  /**
   * Automatically run an address lookup when the user leaves the input field.
   */
  autoLookup = input<boolean>(true);

  /**
   * The current location value, derived from the form control.
   * (Previously a manually-synced signal because `this.value` did not reflect the
   * field value through the `DynamicEditComponent` wrapper — now handled by the base
   * class syncing `valueSignal` from the control.)
   */
  readonly locationValue = computed(() => this.valueSignal());

  override onContainerClick() {
    if (!this.disabled) {
      this.openMap();
    }
  }

  openMap() {
    const config: MapPopupConfig = {
      selectedLocation: this.locationValue(),
      disabled: this.disabled,
    };

    const ref = this.dialog.open(MapPopupComponent, {
      width: "90%",
      height: "95vh",
      autoFocus: ".address-search-input",
      restoreFocus: false,
      data: config,
    });

    if (!this.disabled) {
      ref
        .afterClosed()
        .pipe(
          filter((result: GeoLocation[] | undefined) => {
            return Array.isArray(result);
          }),
          map((result: GeoLocation[]) => result[0]),
          filter(
            (result: GeoLocation | undefined) =>
              JSON.stringify(result) !== JSON.stringify(this.locationValue()),
          ), // nothing changed, skip
        )
        .subscribe((result: GeoLocation) => {
          if (this.ngControl?.control) {
            this.ngControl.control.setValue(result);
          } else {
            this.value = result;
          }
        });
    }
  }
}
