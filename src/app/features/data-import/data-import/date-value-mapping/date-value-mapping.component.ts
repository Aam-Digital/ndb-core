import { Component, Inject } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { ColumnConfig } from "../data-import.component";
import moment from "moment/moment";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";

@Component({
  selector: "app-date-value-mapping",
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatListModule,
    DatePipe,
    ReactiveFormsModule,
  ],
  templateUrl: "./date-value-mapping.component.html",
  styleUrls: ["./date-value-mapping.component.scss"],
})
export class DateValueMappingComponent {
  format = new FormControl("");
  valid = false;
  values: { value: string; parsed?: Date }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public col: ColumnConfig,
    private confirmation: ConfirmationDialogService,
    private dialog: MatDialogRef<any>
  ) {
    this.values = this.col.values.map((value) => ({ value }));
    this.format.valueChanges.subscribe(() => this.checkDateValues());
    this.format.setValue(this.col.additional);
  }

  checkDateValues() {
    this.format.setErrors(undefined);
    this.values.forEach((val) => {
      const date = moment(val.value, this.format.value?.toUpperCase(), true);
      if (date.isValid()) {
        val.parsed = date.toDate();
      } else {
        delete val.parsed;
        this.format.setErrors({ parsingError: true });
      }
    });
    this.values.sort((v) => (v.parsed ? 1 : 0));
  }

  async save() {
    const confirmed =
      !this.format.errors ||
      (await this.confirmation.getConfirmation(
        $localize`Ignore values?`,
        $localize`Some values don't have a mapping and will not be imported. Are you sure you want to keep it like this?`
      ));
    if (confirmed) {
      this.col.additional = this.format.value?.toUpperCase();
      this.dialog.close();
    }
  }
}
