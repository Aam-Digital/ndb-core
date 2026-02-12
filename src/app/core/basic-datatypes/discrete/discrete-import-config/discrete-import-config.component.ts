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
  FormsModule,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { MappingDialogData } from "app/core/import/import-column-mapping/mapping-dialog-data";
import { splitArrayValue } from "app/core/import/import.service";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { KeyValuePipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { ConfigurableEnumService } from "../../configurable-enum/configurable-enum.service";
import { DynamicEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";

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
    ReactiveFormsModule,
    DynamicEditComponent,
    HintBoxComponent,
    MatCheckboxModule,
    FormsModule,
    HelpButtonComponent,
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
  enableSplitting: boolean;
  separator: string;

  ngOnInit() {
    this.schema = this.data.entityType.schema.get(this.data.col.propertyName);
    this.component = this.schemaService.getComponent(this.schema, "edit");
    this.separator = this.data.additionalSettings?.multiValueSeparator ?? ",";

    // For array fields: default to splitting (but can be disabled)
    // For single-select: never split
    if (this.schema?.isArray) {
      this.enableSplitting = this.data.col.enableSplitting ?? true;
    } else {
      this.enableSplitting = false;
    }

    this.buildForm();
  }

  /**
   * Rebuild form when user toggles splitting option.
   * Attempts to preserve existing mappings where possible.
   */
  onSplittingToggle() {
    // Save current mappings before rebuilding
    const currentMappings = this.getValuesInDatabaseFormat(
      this.form.getRawValue(),
    );

    this.buildForm();

    // Try to restore mappings that still match
    const newFormValue = {};
    for (const key in this.form.controls) {
      if (currentMappings[key] !== undefined) {
        newFormValue[key] = this.schemaService.valueToEntityFormat(
          currentMappings[key],
          this.schema,
        );
      }
    }
    if (Object.keys(newFormValue).length > 0) {
      this.form.patchValue(newFormValue);
    }
  }

  /**
   * Build the form with value mappings
   */
  private buildForm() {
    const splitValues = this.splitAndFlattenValues(this.data.values);
    this.form = this.fb.group(
      this.getFormValues(this.data.col.additional, splitValues),
    );
  }

  /**
   * Split raw values using the configured separator and return unique individual values.
   */
  private splitAndFlattenValues(values: any[]): string[] {
    const uniqueValues = new Set<string>();

    for (const value of values) {
      if (value == null || value === "") {
        continue;
      }

      // Split values only if user enabled splitting for this column
      const parts: string[] = this.enableSplitting
        ? splitArrayValue(value, this.separator)
        : [String(value)];
      parts.forEach((part) => uniqueValues.add(part));
    }

    return [...uniqueValues];
  }

  private getFormValues(additional: any, values: string[]) {
    additional = additional || {};

    let enumOptions = [];
    if (this.schema?.additional) {
      const enumEntity = this.configurableEnumService.getEnum(
        this.schema.additional,
      );
      enumOptions = enumEntity?.values ?? [];
    }

    const formObj = {};
    for (const value of values) {
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
      // Save value mappings in 'additional'
      this.data.col.additional = rawValues;

      // Save splitting setting separately (only for array fields)
      if (this.schema?.isArray) {
        this.data.col.enableSplitting = this.enableSplitting;
      }

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
