import { Component, OnInit, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { MappingDialogData } from "app/core/import/import-column-mapping/mapping-dialog-data";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { KeyValuePipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { ConfigurableEnumService } from "../../configurable-enum/configurable-enum.service";
import { DynamicEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

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
    MatFormFieldModule,
    KeyValuePipe,
    MatButtonModule,
    HelpButtonComponent,
    ReactiveFormsModule,
    DynamicEditComponent,
    HintBoxComponent
],
})
export class DiscreteImportConfigComponent implements OnInit {
  data = inject<MappingDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private dialog = inject<MatDialogRef<any>>(MatDialogRef);
  private confirmation = inject(ConfirmationDialogService);
  private schemaService = inject(EntitySchemaService);
  private configurableEnumService = inject(ConfigurableEnumService);

  form: FormGroup;
  component: string;
  schema: EntitySchemaField;

  ngOnInit() {
    this.schema = this.data.entityType.schema.get(this.data.col.propertyName);
    this.component = this.schemaService.getComponent(this.schema, "edit");

    this.form = this.fb.group(this.getFormValues(this.data.col.additional));
  }

  private getFormValues(additional: any) {
    additional = additional || {};

    let enumOptions = [];
    if (this.schema?.additional) {
      const enumEntity = this.configurableEnumService.getEnum(
        this.schema.additional,
      );
      enumOptions = enumEntity?.values ?? [];
    }

    const formObj = {};
    for (const value of this.data.values.filter(Boolean)) {
      let initialValue: string;

      if (value in additional) {
        initialValue = additional[value];
      } else {
        const matchedEnumOption = enumOptions.find(
          (opt) => opt.id === value || opt.label === value,
        );
        initialValue = matchedEnumOption?.id ?? value;
      }
      formObj[value] = new FormControl(
        this.schemaService.valueToEntityFormat(initialValue, this.schema),
      );
    }

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
