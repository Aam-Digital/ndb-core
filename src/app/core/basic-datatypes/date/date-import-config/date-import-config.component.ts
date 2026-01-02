import { Component, inject } from "@angular/core";
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
import { DatePipe, NgClass } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { DateDatatype } from "../date.datatype";

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
    MatListModule,
    NgClass,
    DatePipe,
    MatButtonModule,
    HelpButtonComponent,
  ],
})
export class DateImportConfigComponent {
  data = inject<MappingDialogData>(MAT_DIALOG_DATA);
  private confirmation = inject(ConfirmationDialogService);
  private dialog = inject<MatDialogRef<any>>(MatDialogRef);

  format = new FormControl("");
  valid = false;
  values: { value: string; parsed?: Date }[] = [];

  /**
   * The date formatting interprets lowercase "mm" as minutes instead of months,
   * this may lead to misunderstandings, so we check for it and show a warning if detected.
   */
  hasLowercaseMM: boolean;

  constructor() {
    this.values = this.data.values
      .filter((val) => !!val)
      .map((value) => ({ value }));
    this.format.valueChanges.subscribe(() => this.checkDateValues());
    this.format.setValue(this.data.col.additional);
  }

  async checkDateValues() {
    this.format.setErrors(undefined);
    this.hasLowercaseMM = /mm/.test(this.format.value || "");
    const dateType = new DateDatatype();
    for (const val of this.values) {
      // TODO: check and improve the date parsing. Tests fail with moment.js > 2.29
      const date = await dateType.importMapFunction(
        val.value,
        undefined, // the schema is not needed here, we can skip loading it
        this.format.value,
      );
      if (date instanceof Date && !isNaN(date.getTime())) {
        val.parsed = date;
      } else {
        delete val.parsed;
        this.format.setErrors({ parsingError: true });
      }
    }
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
      this.data.col.additional = this.format.value;
      this.dialog.close();
    }
  }
}
