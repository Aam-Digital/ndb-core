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
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityConstructor } from "app/core/entity/model/entity";

@Component({
  selector: "app-automated-field-mapping",
  imports: [
    MatOptionModule,
    MatSelect,
    MatFormFieldModule,
    MatOption,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: "./automated-field-mapping.component.html",
  styleUrl: "./automated-field-mapping.component.scss",
})
export class AutomatedFieldMappingComponent implements OnInit {
  currentEntityEnumFields: [string, any][];
  availableFields: { id: string; label: string; additional: string }[] = [];
  selectedMappings: { [key: string]: string } = {};
  selectedField: string | null = null;
  currentFieldOptions: ConfigurableEnumValue[] = [];
  enumOptions: ConfigurableEnumValue[] = [];

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
    private dialogRef: MatDialogRef<any>,
    private entityRegistry: EntityRegistry,
    private configurableEnumService: ConfigurableEnumService,
  ) {
    if (data.currentAutomatedMapping) {
      this.selectedMappings = {
        ...data.currentAutomatedMapping?.automatedMapping,
      };
      this.selectedField = data.currentAutomatedMapping?.relatedField ?? null;
    }
  }

  ngOnInit(): void {
    this.availableFields = this.mapEnumFields(this.data.refEntity);
    this.currentEntityEnumFields = this.getEnumFields(this.data.currentEntity);

    this.setCurrentFieldOptions();
    this.initializeSelectedField();
  }

  private initializeSelectedField() {
    if (
      this.selectedField &&
      this.availableFields.some((f) => f.id === this.selectedField)
    ) {
      this.onFieldSelected(this.selectedField);
    }
  }

  private setCurrentFieldOptions() {
    const match = this.currentEntityEnumFields.find(
      ([id]) => id === this.data.currentField,
    );
    if (match) {
      const enumEntity = this.configurableEnumService.getEnum(
        match[1].additional,
      );
      this.currentFieldOptions = enumEntity?.values ?? [];
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
  onFieldSelected(fieldId: string) {
    const selectedField = this.availableFields.find((f) => f.id === fieldId);
    if (!selectedField) return;
    this.selectedField = fieldId;
    const enumEntity = this.configurableEnumService.getEnum(
      selectedField.additional,
    );
    this.enumOptions = enumEntity?.values ?? [];
  }

  save() {
    this.dialogRef.close({
      relatedField: this.selectedField,
      automatedMapping: this.selectedMappings,
    });
  }
}
