import { Component } from "@angular/core";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { HistoricalEntityData } from "../historical-entity-data";
import { ColumnDescription } from "../../entity-subrecord/column-description";
import { PanelConfig } from "../../entity-details/EntityDetailsConfig";
import { ColumnDescriptionInputType } from "../../entity-subrecord/column-description-input-type.enum";

@Component({
  selector: "app-historical-data",
  template: `<app-entity-subrecord
    [records]="entries"
    [columns]="columns"
  ></app-entity-subrecord>`,
  styleUrls: ["./historical-data.component.scss"],
})
export class HistoricalDataComponent implements OnInitDynamicComponent {
  entries: HistoricalEntityData[] = [];
  columns: ColumnDescription[] = [];

  constructor(private entityMapper: EntityMapperService) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entityMapper
      .loadType(HistoricalEntityData)
      .then(
        (entities) =>
          (this.entries = entities.filter(
            (entity) => entity.relatedEntity === config.entity.getId()
          ))
      );
    this.addMissingFunctions(config.config);
    this.columns = config.config;
  }

  private addMissingFunctions(configColumns: ColumnDescription[] = []) {
    return configColumns.map((column) => {
      switch (column.inputType) {
        case ColumnDescriptionInputType.CONFIGURABLE_ENUM:
          column.valueFunction = (entity) => entity[column.name].label;
          break;
      }
    });
  }
}
