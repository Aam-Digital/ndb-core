import { Component, Inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import {
  EntityForm,
  EntityFormService,
} from "app/core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

@Component({
  selector: "app-automated-field-mapping",
  imports: [
    MatOptionModule,
    MatSelect,
    MatFormFieldModule,
    MatOption,
    MatDialogModule,
    MatButtonModule,
    EntityFieldEditComponent,
  ],
  templateUrl: "./automated-field-mapping.component.html",
  styleUrl: "./automated-field-mapping.component.scss",
})
export class AutomatedFieldMappingComponent implements OnInit {
  currentEntityEnumFields: [string, any][];
  availableFields: { id: string; label: string; additional: string }[] = [];
  selectedMappings: { [key: string]: string } = {};
  selectedField: string | null = null;
  sourceOptions: ConfigurableEnumValue[] = [];
  targetFieldConfig: FormFieldConfig;

  fieldSchema: EntitySchemaField;
  mappingForms: {
    [sourceId: string]: {
      entity: Entity;
      form: EntityForm<Entity>;
    };
  } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: {
      currentEntity: EntityConstructor;
      refEntity: EntityConstructor;
      currentField: string;
      currentAutomatedMapping?: {
        automatedMapping: { [key: string]: string };
        relatedField?: string;
      };
    },
    private entityFormService: EntityFormService,
    private dialogRef: MatDialogRef<any>,
    private entityRegistry: EntityRegistry,
    private configurableEnumService: ConfigurableEnumService,
    private schemaService: EntitySchemaService,
  ) {
    if (data.currentAutomatedMapping) {
      this.selectedMappings = data.currentAutomatedMapping?.automatedMapping;
      this.selectedField = data.currentAutomatedMapping?.relatedField;
    }
  }

  ngOnInit(): void {
    this.availableFields = this.mapEnumFields(this.data.refEntity);
    this.currentEntityEnumFields = this.getEnumFields(this.data.currentEntity);
    this.initializeSelectedField();
    this.targetFieldConfig = this.entityFormService.extendFormFieldConfig(
      this.data.currentField,
      this.data.currentEntity,
    );
  }

  private initializeSelectedField() {
    if (
      this.selectedField &&
      this.availableFields.some((f) => f.id === this.selectedField)
    ) {
      this.loadSourceOptions(this.selectedField);
    }
  }

  private getEnumFields(entity: EntityConstructor) {
    const entityType = this.entityRegistry.get(entity.ENTITY_TYPE);
    return Array.from(entityType.schema.entries()).filter(
      ([_, schema]) => schema.dataType === ConfigurableEnumDatatype.dataType,
    );
  }

  private mapEnumFields(entity: EntityConstructor) {
    return this.getEnumFields(entity).map(([id, schema]) => ({
      id,
      label: schema.label,
      additional: schema.additional,
    }));
  }

  async loadSourceOptions(fieldId: string) {
    const selectedField = this.availableFields.find((f) => f.id === fieldId);
    if (!selectedField) return;
    this.selectedField = fieldId;
    const enumEntity = this.configurableEnumService.getEnum(
      selectedField.additional,
    );
    this.sourceOptions = enumEntity?.values ?? [];
    this.mappingForms = {};

    for (const sourceOption of this.sourceOptions) {
      const entity = new this.data.currentEntity();
      let selectedValue: any = this.selectedMappings[sourceOption.id];
      this.fieldSchema = entity.getSchema().get(this.data.currentField);

      if (selectedValue) {
        selectedValue = this.schemaService.valueToEntityFormat(
          selectedValue,
          this.fieldSchema,
        );
      }
      entity[this.data.currentField] = selectedValue ?? null;

      const form = await this.entityFormService.createEntityForm(
        [this.data.currentField],
        entity,
      );
      // Track form value changes
      form.formGroup
        .get(this.data.currentField)
        .valueChanges.subscribe((value) => {
          this.selectedMappings[sourceOption.id] = value;
        });
      this.mappingForms[sourceOption.id] = { entity, form };
    }
  }

  save() {
    const formattedMappings: { [key: string]: any } = {};
    Object.entries(this.selectedMappings).forEach(([key, value]) => {
      formattedMappings[key] = this.schemaService.valueToDatabaseFormat(
        value,
        this.fieldSchema,
      );
    });
    this.dialogRef.close({
      relatedField: this.selectedField,
      automatedMapping: formattedMappings,
    });
  }
}
