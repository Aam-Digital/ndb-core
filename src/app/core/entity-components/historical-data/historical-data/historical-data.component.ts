import { Component } from "@angular/core";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { HistoricalEntityData } from "../historical-entity-data";
import { ColumnDescription } from "../../entity-subrecord/column-description";
import { PanelConfig } from "../../entity-details/EntityDetailsConfig";
import { ColumnDescriptionInputType } from "../../entity-subrecord/column-description-input-type.enum";
import { Entity } from "../../../entity/entity";

@Component({
  selector: "app-historical-data",
  template: `
      <app-entity-subrecord
              [records]="entries"
              [columns]="columns"
              [newRecordFactory]="getNewEntryFunction()"
      ></app-entity-subrecord>`,
  styleUrls: ["./historical-data.component.scss"],
})
export class HistoricalDataComponent implements OnInitDynamicComponent {
  entries: HistoricalEntityData[] = [];
  columns: ColumnDescription[] = [];
  private entity: Entity;

  constructor(private entityMapper: EntityMapperService) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.addMissingFunctions(config.config);
    this.columns = config.config;
    const allEntries = await this.entityMapper.loadType(HistoricalEntityData);
    this.entries = allEntries.filter(
      (entry) => entry.relatedEntity === this.entity.getId()
    );
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

  public getNewEntryFunction(): () => HistoricalEntityData {
    return () => {
      const newEntry = new HistoricalEntityData();
      newEntry.relatedEntity = this.entity.getId();
      newEntry.date = new Date();
      return newEntry;
    };
  }
}
