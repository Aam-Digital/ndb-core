import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { MappingDialogData } from "../../../core/import/import-column-mapping/mapping-dialog-data";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

export interface LocationImportConfig {
  skipAddressLookup: boolean;
}

/**
 * Configuration dialog for importing location data.
 * Allows users to skip the address lookup when importing.
 */
@DynamicComponent("LocationImportConfig")
@Component({
  selector: "app-location-import-config",
  templateUrl: "./location-import-config.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatButtonModule,
    HintBoxComponent,
  ],
})
export class LocationImportConfigComponent {
  data = inject<MappingDialogData>(MAT_DIALOG_DATA);
  private readonly dialog = inject<MatDialogRef<any>>(MatDialogRef);

  skipAddressLookup = new FormControl(false);

  constructor() {
    const additional = this.data.col.additional as LocationImportConfig;
    if (additional?.skipAddressLookup) {
      this.skipAddressLookup.setValue(additional.skipAddressLookup);
    }
  }

  save() {
    this.data.col.additional = {
      skipAddressLookup: this.skipAddressLookup.value,
    } as LocationImportConfig;
    this.dialog.close();
  }
}
