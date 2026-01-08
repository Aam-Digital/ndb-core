import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "#src/app/core/entity/entity-field-label/entity-field-label.component";
import {
  Component,
  computed,
  effect,
  inject,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";
import { DefaultValueConfigInheritedField } from "../../inherited-field-config";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { ConfigurableEnumDatatype } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";

/**
 * Dialog to configure additional details for the "inherited-field"
 * default value strategy, working in combination with the admin components.
 */
@Component({
  selector: "app-automated-field-mapping",
  imports: [
    MatOptionModule,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    EntityFieldEditComponent,
    EntityFieldLabelComponent,
    DialogCloseComponent,
    EntityFieldSelectComponent,
    MatSlideToggle,
  ],
  templateUrl: "./automated-field-mapping.component.html",
  styleUrl: "./automated-field-mapping.component.scss",
})
export class AutomatedFieldMappingComponent {
  private readonly dialogRef = inject<MatDialogRef<any>>(MatDialogRef);
  private readonly configurableEnumService = inject(ConfigurableEnumService);
  private readonly schemaService = inject(EntitySchemaService);

  /** The full schema of the field for which this default value is configured */
  targetFieldConfig: FormFieldConfig;

  /** The entity type of the related entity that triggers the updates */
  sourceValueEntityType: EntityConstructor;

  value: DefaultValueConfigInheritedField;

  /** The currently selected "sourceValueField" on the related entity */
  selectedSourceValueField: WritableSignal<string | null>;

  sourceValueFieldSchema: Signal<EntitySchemaField> = computed(() => {
    const fieldId = this.selectedSourceValueField();
    if (!fieldId) return;
    return this.sourceValueEntityType.schema.get(fieldId);
  });

  /**
   * The possible values of the selected sourceValueField that can be mapped to custom target values.
   * Currently mapping only supported for ConfigurableEnum fields.
   */
  valueMappingOptions: Signal<
    {
      sourceValue: ConfigurableEnumValue;
      sourceValueRaw: string;
      form: EntityForm<Entity>;
    }[]
  > = computed(() => {
    if (
      this.sourceValueFieldSchema()?.dataType !==
      ConfigurableEnumDatatype.dataType
    ) {
      // only configurable-enum fields supported currently
      return [];
    }

    const enumEntity = this.configurableEnumService.getEnum(
      this.sourceValueFieldSchema().additional,
    );

    const values = enumEntity?.values ?? [];
    return values.map((sourceValue) => {
      const sourceValueRaw = sourceValue.id; // database format of the source value

      // select existing mapping value if available
      let selectedMappedValue: any = this.value.valueMapping?.[sourceValueRaw];
      if (selectedMappedValue) {
        selectedMappedValue = this.schemaService.valueToEntityFormat(
          selectedMappedValue,
          this.targetFieldConfig,
        );
      }

      const formControl = new FormControl(selectedMappedValue);

      // simulate a full entity-form to use the entity-field-edit component including validation, etc.
      this.targetFieldConfig.id = "targetValue";
      const formGroup = new FormGroup({
        [this.targetFieldConfig.id]: formControl,
      });

      return {
        sourceValue,
        sourceValueRaw,
        form: {
          formGroup,
        } as unknown as EntityForm<Entity>,
      };
    });
  });

  /**
   * If the user explicitly enabled the optional value mapping functionality
   */
  mappingEnabled = signal(false);
  enableIfMappingsExist = effect(() => {
    if (this.valueMappingOptions() && this.value.valueMapping) {
      this.mappingEnabled.set(true);
    }
  });

  isInvalidMapping: boolean = false;

  constructor() {
    const data = inject<AutomatedFieldMappingDialogData>(MAT_DIALOG_DATA);

    this.targetFieldConfig = data.currentField;
    this.value = data.value;
    this.sourceValueEntityType = data.sourceValueEntityType;

    this.selectedSourceValueField = signal(
      this.value?.sourceValueField ?? null,
    );
  }

  save() {
    const selectedMappings = {};
    if (this.mappingEnabled()) {
      this.isInvalidMapping = this.valueMappingOptions().some((v) => {
        v.form.formGroup.markAllAsTouched();
        return v.form.formGroup.invalid;
      });
      if (this.isInvalidMapping) return;

      this.valueMappingOptions().forEach(({ sourceValueRaw, form }) => {
        const value = form.formGroup.get(this.targetFieldConfig.id)?.value;
        selectedMappings[sourceValueRaw] =
          this.schemaService.valueToDatabaseFormat(
            value,
            this.targetFieldConfig,
          );
      });
    }

    const newValue: DefaultValueConfigInheritedField = {
      ...this.value,
      sourceValueField: this.selectedSourceValueField(),
      valueMapping: selectedMappings,
    };
    if (Object.keys(selectedMappings).length === 0) {
      // do not store empty mappings and delete any potentially existing mappings
      delete newValue.valueMapping;
    }

    this.dialogRef.close(newValue);
  }
}

/**
 * The DialogData for the `AutomatedFieldMappingComponent`
 */
export interface AutomatedFieldMappingDialogData {
  currentEntityType: EntityConstructor;
  currentField: FormFieldConfig;
  sourceValueEntityType: EntityConstructor;
  value: DefaultValueConfigInheritedField;
}
