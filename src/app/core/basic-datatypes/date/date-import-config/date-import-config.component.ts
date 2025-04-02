import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import moment from "moment/moment";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MappingDialogData } from "app/core/import/import-column-mapping/mapping-dialog-data";
import { MatInputModule } from "@angular/material/input";
import { DatePipe, NgClass, NgForOf, NgIf } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * Configuration dialog for parsing date value of data imported from a file.
 */
@DynamicComponent("DateImportConfig")
@Component({
  selector: "app-date-import-config",
  templateUrl: "./date-import-config.component.html",
  styleUrls: ["./date-import-config.component.scss"],
  imports: [
    MatDialogModule,
    MatInputModule,
    ReactiveFormsModule,
    NgIf,
    MatListModule,
    NgForOf,
    NgClass,
    DatePipe,
    MatButtonModule,
    HelpButtonComponent,
  ],
})
export class DateImportConfigComponent {
  format = new FormControl("");
  valid = false;
  values: { value: string; parsed?: Date }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MappingDialogData,
    private confirmation: ConfirmationDialogService,
    private dialog: MatDialogRef<any>,
  ) {
    this.values = this.data.values
      .filter((val) => !!val)
      .map((value) => ({ value }));
    this.format.valueChanges.subscribe(() => this.checkDateValues());
    this.format.setValue(this.data.col.additional);
  }

  checkDateValues() {
    this.format.setErrors(undefined);
    this.values.forEach((val) => {
      // TODO: check and improve the date parsing. Tests fail with moment.js > 2.29
      const date = moment(val.value, this.format.value?.toUpperCase(), true);
      if (date.isValid()) {
        val.parsed = date.toDate();
      } else {
        delete val.parsed;
        this.format.setErrors({ parsingError: true });
      }
    });
    // Sort unparsed dates to front
    this.values.sort((v1, v2) =>
      v1.parsed && !v2.parsed ? 1 : !v1.parsed && v2.parsed ? -1 : 0,
    );
  }

  async save() {
    const confirmed =
      !this.format.errors ||
      (await this.confirmation.getConfirmation(
        $localize`Ignore values?`,
        $localize`Some values don't have a mapping and will not be imported. Are you sure you want to keep it like this?`,
      ));
    if (confirmed) {
      this.data.col.additional = this.format.value?.toUpperCase();
      this.dialog.close();
    }
  }
}
