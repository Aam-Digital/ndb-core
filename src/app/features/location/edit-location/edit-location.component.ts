import { Component, inject, Input, OnInit } from "@angular/core";
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
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

/**
 * Input to select and view an address on a map.
 */
@UntilDestroy()
@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  styleUrls: [
    "./edit-location.component.scss",
    "../../../core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
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
  implements EditComponent, OnInit
{
  private readonly dialog = inject(MatDialog);

  @Input() formFieldConfig?: FormFieldConfig;

  /**
   * Automatically run an address lookup when the user leaves the input field.
   */
  @Input() autoLookup = true;

  /**
   * The location value
   * (because this.value doesn't always reflect the correct field value, probably because of the DynamicEditComponent wrapper).
   */
  locationValue: GeoLocation;

  override set value(v: GeoLocation) {
    super.value = v;
    this.locationValue = v;
  }

  override get value() {
    return super.value;
  }

  ngOnInit(): void {
    if (this.ngControl?.control) {
      this.locationValue = this.ngControl.control.value;
      this.ngControl.control.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((value) => (this.locationValue = value));
    }
  }

  override onContainerClick() {
    if (!this._disabled) {
      this.openMap();
    }
  }

  openMap() {
    const config: MapPopupConfig = {
      selectedLocation: this.locationValue,
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
              JSON.stringify(result) !== JSON.stringify(this.locationValue),
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
