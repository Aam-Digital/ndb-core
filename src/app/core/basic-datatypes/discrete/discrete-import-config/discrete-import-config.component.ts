import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { MappingDialogData } from "../../../import/import-column-mapping/import-column-mapping.component";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { KeyValuePipe, NgForOf } from "@angular/common";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * UI to configure import value mappings for discrete datatypes like boolean or enum.
 */
@DynamicComponent("DiscreteImportConfig")
@Component({
  selector: "app-discrete-import-config",
  templateUrl: "./discrete-import-config.component.html",
  styleUrls: ["./discrete-import-config.component.scss"],
  imports: [
    MatDialogModule,
    NgForOf,
    KeyValuePipe,
    DynamicComponentDirective,
    MatButtonModule,
    HelpButtonComponent,
  ],
})
export class DiscreteImportConfigComponent implements OnInit {
  form: FormGroup;
  component: string;
  schema: EntitySchemaField;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: MappingDialogData,
    private fb: FormBuilder,
    private dialog: MatDialogRef<any>,
    private confirmation: ConfirmationDialogService,
    private schemaService: EntitySchemaService,
  ) {}

  ngOnInit() {
    this.schema = this.data.entityType.schema.get(this.data.col.propertyName);
    this.component = this.schemaService.getComponent(this.schema, "edit");

    this.form = this.fb.group(this.getFormValues(this.data.col.additional));
  }

  private getFormValues(additional: any) {
    if (!additional) {
      additional = {};
    }

    const formObj = {};
    this.data.values
      .filter((val) => !!val)
      .forEach((val) => {
        let selectedMapping;
        if (additional.hasOwnProperty(val)) {
          selectedMapping = this.schemaService.valueToEntityFormat(
            additional[val],
            this.schema,
          );
        }
        formObj[val] = new FormControl(selectedMapping);
      });

    return formObj;
  }

  async save() {
    const rawValues = this.getValuesInDatabaseFormat(this.form.getRawValue());
    const allFilled = Object.values(rawValues).every((val) => !!val);
    const confirmed =
      allFilled ||
      (await this.confirmation.getConfirmation(
        $localize`Ignore values?`,
        $localize`Some values don't have a mapping and will not be imported. Are you sure you want to keep it like this?`,
      ));
    if (confirmed) {
      this.data.col.additional = rawValues;
      this.dialog.close();
    }
  }

  /**
   * Transform object property values into their database format values to be stored.
   * @private
   */
  private getValuesInDatabaseFormat(rawValues: any) {
    for (const k in rawValues) {
      rawValues[k] = this.schemaService.valueToDatabaseFormat(
        rawValues[k],
        this.schema,
      );
    }

    return rawValues;
  }
}
