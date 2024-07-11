import { Component, ElementRef, Optional, Self } from "@angular/core";
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
import { GeoResult } from "../geo.service";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";
import { MatDialog } from "@angular/material/dialog";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatTooltip } from "@angular/material/tooltip";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";

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
  constructor(
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,

    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService,
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup,
    );
  }

  updateLocationString(value: string) {
    const manualAddress: string = value ?? "";
    if (manualAddress === "" && this.value?.geoLookup) {
      // TODO ask user if they want to remove the mapped location also?
      delete this.value?.geoLookup;
    }

    this.value = {
      locationString: manualAddress,
      geoLookup: this.value?.geoLookup,
    };
  }

  async updateGeoLookup(value: GeoResult | undefined) {
    if (value === this.value.geoLookup) {
      // nothing changed, skip
      return;
    }

    let manualAddress: string = this.value?.locationString ?? "";
    let lookupAddress: string = value?.display_name ?? "";

    if (manualAddress === "") {
      // auto-apply lookup location for empty field
      manualAddress = lookupAddress;
    }
    if (manualAddress !== lookupAddress) {
      if (
        // if manualAddress has been automatically set before, we assume the user wants to auto update now also
        manualAddress === this.value?.geoLookup?.display_name ||
        // otherwise ask user if they want to apply the lookup location
        (await this.confirmationDialog.getConfirmation(
          $localize`Update custom address?`,
          $localize`Do you want to overwrite the custom address to the full address from the online lookup? This will replace "${manualAddress}" with "${lookupAddress}". The marked location on the map will be unaffected by this choice.`,
        ))
      ) {
        manualAddress = lookupAddress;
      }
    }

    this.value = {
      locationString: manualAddress,
      geoLookup: value,
    };
  }

  openMap() {
    const config: MapPopupConfig = {
      marked: [this.value?.geoLookup],
      disabled: this._disabled,
      initialSearchText: this.value?.locationString,
    };

    const ref = this.dialog.open(MapPopupComponent, {
      width: "90%",
      data: config,
    });

    if (!this._disabled) {
      ref
        .afterClosed()
        .pipe(
          filter((result: GeoResult[] | undefined) => Array.isArray(result)),
        )
        .subscribe((result: GeoResult[]) => this.updateGeoLookup(result[0]));
    }
  }
}
