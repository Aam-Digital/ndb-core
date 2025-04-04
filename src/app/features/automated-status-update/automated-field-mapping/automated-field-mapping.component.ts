import { Component, Inject, OnInit } from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatOptionModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";

@Component({
  selector: "app-automated-field-mapping",
  imports: [
    MatChipsModule,
    MatOptionModule,
    MatSelect,
    MatFormFieldModule,
    MatOption,
  ],
  templateUrl: "./automated-field-mapping.component.html",
  styleUrl: "./automated-field-mapping.component.scss",
})
export class AutomatedFieldMappingComponent<E extends Entity>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  entitiesToSetAutomateRule: EntityConstructor;
  availableFields: { id: string; label: string; additional: string }[] = [];

  selectedField: string | null = null;
  fieldOptions: string[] = [];
  selectedValue: string | null = null;
  enumOptions: ConfigurableEnumValue[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entity: EntityConstructor;
    },
    private dialogRef: MatDialogRef<any>,
    private entityRegistry: EntityRegistry,
    private entityMapperService: EntityMapperService,
    private configurableEnumService: ConfigurableEnumService,
  ) {
    this.entitiesToSetAutomateRule = data.entity;
  }

  async ngOnInit(): Promise<void> {
    const entityType = this.entityRegistry.get(
      this.entitiesToSetAutomateRule.ENTITY_TYPE,
    );
    const entries = Array.from(entityType.schema.entries());
    console.log(entries);

    this.availableFields = entries
      .filter(
        ([_, schema]) => schema.dataType === ConfigurableEnumDatatype.dataType,
      )
      .map(([id, schema]) => ({
        id,
        label: schema.label,
        additional: schema.additional,
      }));
  }

  onFieldSelected(field: { id: string; label: string; additional: string }) {
    this.selectedField = field.id;

    const enumEntity = this.configurableEnumService.getEnum(field.additional);
    this.enumOptions = enumEntity.values ?? [];
  }
}
