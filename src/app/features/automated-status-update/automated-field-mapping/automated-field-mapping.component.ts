import { Component, Inject, OnInit } from "@angular/core";
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
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "app/core/common-components/entity-field-label/entity-field-label.component";
import {
  EntityForm,
  EntityFormService,
} from "app/core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";

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
  availableFields: { id: string; label: string; additional: string }[] = [];
  selectedMappings: { [key: string]: any } = {};
  selectedField: string | null = null;
  sourceOptions: ConfigurableEnumValue[] = [];
  targetFieldConfig: FormFieldConfig;
  isInvalid: boolean = false;
  relatedReferenceFields: string[];
  selectedRelatedReferenceField: string;

  mappingForms: {
    [sourceId: string]: EntityForm<Entity>;
  } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      currentEntity: EntityConstructor;
      refEntity: EntityConstructor;
      currentField: FormFieldConfig;
      // TODO: can/should we use currentField.defaultValue instead of passing the following?
      currentAutomatedMapping?: {
        automatedMapping: { [key: string]: string };
        relatedTriggerField?: string;
      };
      relatedReferenceFields: string[];
      currentRelatedReferenceField?: string;
    },
    private entityFormService: EntityFormService,
    private dialogRef: MatDialogRef<any>,
    private entityRegistry: EntityRegistry,
    private configurableEnumService: ConfigurableEnumService,
    private schemaService: EntitySchemaService,
  ) {
    if (data.currentAutomatedMapping) {
      this.selectedMappings = data.currentAutomatedMapping?.automatedMapping;
      this.selectedField = data.currentAutomatedMapping?.relatedTriggerField;
    }
    this.relatedReferenceFields = data?.relatedReferenceFields;
    this.selectedRelatedReferenceField =
      data?.currentRelatedReferenceField ||
      (this.relatedReferenceFields ? this.relatedReferenceFields[0] : null);
  }

  ngOnInit(): void {
    this.availableFields = this.mapEnumFields(this.data.refEntity);
    this.initializeSelectedField();

    this.targetFieldConfig = this.data.currentField;
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
      let selectedValue: any = this.selectedMappings[sourceOption.id];

      if (selectedValue) {
        selectedValue = this.schemaService.valueToEntityFormat(
          selectedValue,
          this.targetFieldConfig,
        );
      }

      const formField = new FormControl(selectedValue);
      //await this.entityFormService.createEntityForm([this.data.currentField], entity);
      // Track form value changes
      formField.valueChanges.subscribe((value) => {
        this.selectedMappings[sourceOption.id] = value;
      });
      this.targetFieldConfig.id = "targetValue";
      const formGroup = new FormGroup({
        [this.targetFieldConfig.id]: formField,
      });
      this.mappingForms[sourceOption.id] = {
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
    const formattedMappings: { [key: string]: any } = {};
    Object.entries(this.selectedMappings).forEach(([key, value]) => {
      formattedMappings[key] = this.schemaService.valueToDatabaseFormat(
        value,
        this.targetFieldConfig,
      );
    });
    this.dialogRef.close({
      relatedTriggerField: this.selectedField,
      relatedReferenceField: this.selectedRelatedReferenceField,
      automatedMapping: formattedMappings,
    });
  }
}
