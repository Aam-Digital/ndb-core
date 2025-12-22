import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "#src/app/core/entity/entity-field-label/entity-field-label.component";
import { Component, inject, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ConfigurableEnumDatatype } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";

/**
 * Dialog to configure additional details for the "inherited-field"
 * default value strategy, working in combination with the admin components.
 */
@Component({
  selector: "app-automated-field-mapping",
  imports: [
    MatOptionModule,
    MatSelect,
    MatFormFieldModule,
    MatOption,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    EntityFieldEditComponent,
    EntityFieldLabelComponent,
    DialogCloseComponent,
  ],
  templateUrl: "./automated-field-mapping.component.html",
  styleUrl: "./automated-field-mapping.component.scss",
})
export class AutomatedFieldMappingComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<any>>(MatDialogRef);
  private configurableEnumService = inject(ConfigurableEnumService);
  private schemaService = inject(EntitySchemaService);

  /** The currently selected relatedReferenceField on the related entity */
  selectedReferenceField: string;
  /** all fields for selection as selectedReferenceField */
  availableReferenceFields: string[];

  /** The currently selected "relatedTriggerField" on the related entity */
  selectedTriggerField: string | null = null;
  /** all fields for selection as selectedTriggerField */
  availableTriggerFields: { id: string; label: string; additional: string }[] =
    [];

  /**
   * A mapping of triggerfieldValues to their corresponding EntityForm instances.
   * Each EntityForm represents the form configuration for a specific trigger field value.
   * For example:
   * {
   *   "male ": { formGroup },
   *   "female": { formGroup },
   * }
   */
  mappingForms: {
    [triggerfieldValue: string]: EntityForm<Entity>;
  } = {};
  /** The valueMapping rules for the selectedTriggerField
   * The mapping is a dictionary where the key is the triggerFieldValue and the value is the currentField value.
   */
  selectedMappings: { [key: string]: any } = {};
  /** The available values for the selectedTriggerField */
  triggerFieldValues: ConfigurableEnumValue[] = [];

  /** The full schema of the field for which this default value is configured */
  targetFieldConfig: FormFieldConfig;
  /** The entity type of the related entity that triggers the updates */
  relatedEntityType: EntityConstructor;

  isInvalid: boolean = false;

  constructor() {
    const data = inject<AutomatedFieldMappingDialogData>(MAT_DIALOG_DATA);

    this.targetFieldConfig = data.currentField;
    this.relatedEntityType = data.relatedEntityType;
    this.availableReferenceFields = data.relatedReferenceFields;

    const defaultValueConfig =
      this.targetFieldConfig.defaultValue?.config || {};
    this.selectedReferenceField =
      defaultValueConfig.sourceReferenceField ||
      (this.availableReferenceFields ? this.availableReferenceFields[0] : null);
    this.selectedMappings = defaultValueConfig.valueMapping || {};
    this.selectedTriggerField = defaultValueConfig.sourceValueField;
  }

  ngOnInit(): void {
    this.initAvailableTriggerFields();

    this.initSelectedField();
  }

  private initAvailableTriggerFields() {
    this.availableTriggerFields = Array.from(
      this.relatedEntityType.schema?.entries() ?? [],
    )
      .filter(
        ([_, schema]) => schema.dataType === ConfigurableEnumDatatype.dataType,
      )
      .map(([id, schema]) => ({
        id,
        label: schema.label,
        additional: schema.additional,
      }));
  }

  private initSelectedField() {
    if (
      this.selectedTriggerField &&
      this.availableTriggerFields.some(
        (f) => f.id === this.selectedTriggerField,
      )
    ) {
      this.loadtriggerFieldValues(this.selectedTriggerField);
    }
  }

  loadtriggerFieldValues(fieldId: string) {
    const selectedField = this.availableTriggerFields.find(
      (f) => f.id === fieldId,
    );
    if (!selectedField) return;

    this.selectedTriggerField = fieldId;
    const enumEntity = this.configurableEnumService.getEnum(
      selectedField.additional,
    );
    this.triggerFieldValues = enumEntity?.values ?? [];
    this.mappingForms = {};

    for (const triggerFieldValue of this.triggerFieldValues) {
      let selectedValue: any = this.selectedMappings[triggerFieldValue.id];

      if (selectedValue) {
        selectedValue = this.schemaService.valueToEntityFormat(
          selectedValue,
          this.targetFieldConfig,
        );
      }

      const formField = new FormControl(selectedValue);
      // Track form value changes
      formField.valueChanges.subscribe((value) => {
        this.selectedMappings[triggerFieldValue.id] = value;
      });
      this.targetFieldConfig.id = "targetValue";
      const formGroup = new FormGroup({
        [this.targetFieldConfig.id]: formField,
      });
      this.mappingForms[triggerFieldValue.id] = {
        formGroup,
      } as unknown as EntityForm<Entity>;
    }
  }

  save() {
    this.isInvalid = Object.values(this.mappingForms).some((mappingForm) => {
      mappingForm.formGroup.markAllAsTouched();
      return mappingForm.formGroup.invalid;
    });
    if (this.isInvalid) return;

    Object.entries(this.mappingForms).forEach(([key, mappingForm]) => {
      const value = mappingForm.formGroup.get(this.targetFieldConfig.id)?.value;
      this.selectedMappings[key] = this.schemaService.valueToDatabaseFormat(
        value,
        this.targetFieldConfig,
      );
    });

    this.dialogRef.close({
      sourceValueField: this.selectedTriggerField,
      sourceReferenceField: this.selectedReferenceField,
      valueMapping: this.selectedMappings,
    });
  }
}

/**
 * The DialogData for the `AutomatedFieldMappingComponent`
 */
export interface AutomatedFieldMappingDialogData {
  currentEntityType: EntityConstructor;
  relatedEntityType: EntityConstructor;
  currentField: FormFieldConfig;
  relatedReferenceFields: string[];
}
