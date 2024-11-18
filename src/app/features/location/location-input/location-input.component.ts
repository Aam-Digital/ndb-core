import { Component, ElementRef, Input, Optional, Self } from "@angular/core";
import {
  FormGroupDirective,
  FormsModule,
  NgControl,
  NgForm,
} from "@angular/forms";
import { MatFormFieldControl, MatSuffix } from "@angular/material/form-field";
import { GeoLocation } from "../location.datatype";
import { MatInput } from "@angular/material/input";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";
import { MatDialog } from "@angular/material/dialog";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatTooltip } from "@angular/material/tooltip";
import { filter, map } from "rxjs/operators";

@Component({
  selector: "app-location-input",
  standalone: true,
  imports: [
    FormsModule,
    MatInput,
    MatIconButton,
    FaIconComponent,
    MatSuffix,
    MatTooltip,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: LocationInputComponent },
  ],
  templateUrl: "./location-input.component.html",
  styleUrls: ["./location-input.component.scss"],
})
export class LocationInputComponent extends CustomFormControlDirective<GeoLocation> {
  /**
   * Automatically run an address lookup when the user leaves the input field.
   */
  @Input() autoLookup = true;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,

    private dialog: MatDialog,
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup,
    );
  }

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
