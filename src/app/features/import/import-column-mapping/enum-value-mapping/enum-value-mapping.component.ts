import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { MappingDialogData } from "../import-column-mapping.component";
import { EntitySchemaField } from "../../../../core/entity/schema/entity-schema-field";
import { KeyValuePipe, NgForOf } from "@angular/common";
import { DynamicComponentDirective } from "../../../../core/view/dynamic-components/dynamic-component.directive";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-enum-value-mapping",
  templateUrl: "./enum-value-mapping.component.html",
  styleUrls: ["./enum-value-mapping.component.scss"],
  standalone: true,
  imports: [
    MatDialogModule,
    NgForOf,
    KeyValuePipe,
    DynamicComponentDirective,
    MatButtonModule,
  ],
})
export class EnumValueMappingComponent {
  form: FormGroup;
  component: string;
  schema: EntitySchemaField;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: MappingDialogData,
    private fb: FormBuilder,
    private dialog: MatDialogRef<any>,
    private confirmation: ConfirmationDialogService,
    private schemaService: EntitySchemaService
  ) {
    this.schema = data.entityType.schema.get(data.col.propertyName);
    this.component = this.schemaService.getComponent(this.schema, "edit");
    const formObj = { ...data.col.additional };
    data.values
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
      this.data.col.additional = rawValues;
      this.dialog.close();
    }
  }
}
