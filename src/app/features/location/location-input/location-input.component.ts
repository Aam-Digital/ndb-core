import { Component, inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatFormFieldControl, MatSuffix } from "@angular/material/form-field";
import { GeoLocation } from "../geo-location";
import { MatInput } from "@angular/material/input";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";
import { MatDialog } from "@angular/material/dialog";
import { MatTooltip } from "@angular/material/tooltip";
import { filter, map } from "rxjs/operators";

@Component({
  selector: "app-location-input",
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
  private dialog = inject(MatDialog);

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
