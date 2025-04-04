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
  entitiesToSetAutomateRule: EntityConstructor;
  currentEntity: EntityConstructor;
  availableFields: { id: string; label: string; additional: string }[] = [];
  selectedMappings: { [key: string]: string } = {};
  selectedField: string | null = null;
  fieldOptions: string[] = [];
  fieldId: string | null = null;
  selectedValue: string | null = null;
  currentFieldOptions: ConfigurableEnumValue[] = [];
  enumOptions: ConfigurableEnumValue[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      currentEntity: EntityConstructor;
      refEntity: EntityConstructor;
      currentField: string;
    },
    private dialogRef: MatDialogRef<any>,
    private entityRegistry: EntityRegistry,
    private configurableEnumService: ConfigurableEnumService,
  ) {
    this.entitiesToSetAutomateRule = data.refEntity;
    this.currentEntity = data.currentEntity;
    this.fieldId = data.currentField;
  }

  ngOnInit(): void {
    const entries = this.getEnumFields(this.entitiesToSetAutomateRule);
    this.availableFields = entries.map(([id, schema]) => ({
      id,
      label: schema.label,
      additional: schema.additional,
    }));
    this.setCurrentFieldOptions();
  }

  private setCurrentFieldOptions() {
    const entries = this.getEnumFields(this.currentEntity);
    const match = entries.find(([id]) => id === this.fieldId);
    if (match) {
      const [, schema] = match;
      const enumEntity = this.configurableEnumService.getEnum(
        schema.additional,
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
  onFieldSelected(field: { id: string; label: string; additional: string }) {
    this.selectedField = field.id;
    const enumEntity = this.configurableEnumService.getEnum(field.additional);
    this.enumOptions = enumEntity.values ?? [];
  }

  save() {}
}
