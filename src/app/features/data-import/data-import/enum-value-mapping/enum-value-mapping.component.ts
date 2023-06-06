import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { ColumnConfig } from "../data-import.component";
import { ConfigurableEnumValue } from "../../../../core/configurable-enum/configurable-enum.interface";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EnumDropdownComponent } from "../../../../core/configurable-enum/enum-dropdown/enum-dropdown.component";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { EditConfigurableEnumComponent } from "../../../../core/configurable-enum/edit-configurable-enum/edit-configurable-enum.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";

@Component({
  selector: "app-enum-value-mapping",
  standalone: true,
  imports: [
    CommonModule,
    EditConfigurableEnumComponent,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: "./enum-value-mapping.component.html",
  styleUrls: ["./enum-value-mapping.component.scss"],
})
export class EnumValueMappingComponent {
  enumValues: ConfigurableEnumValue[];
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public col: ColumnConfig,
    private fb: FormBuilder,
    private dialog: MatDialogRef<any>,
    private confirmation: ConfirmationDialogService
  ) {
    this.dialog.disableClose = true;
    const formObj = { ...col.additional };
    col.values
      .filter((val) => !!val && !formObj.hasOwnProperty(val))
      .forEach((val) => (formObj[val] = new FormControl()));
    this.form = this.fb.group(formObj);
  }

  async save() {
    const rawValues = this.form.getRawValue();
    const allFilled = Object.values(rawValues).every((val) => !!val);
    const confirmed =
      allFilled ||
      (await this.confirmation.getConfirmation(
        $localize`Ignore values?`,
        $localize`Some values don't have a mapping and will not be imported. Are you sure you want to keep it like this?`
      ));
    if (confirmed) {
      this.col.additional = rawValues;
      this.dialog.close();
    }
  }

  cancel() {
    this.dialog.close();
  }
}
