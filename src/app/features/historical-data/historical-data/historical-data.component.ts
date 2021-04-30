import { Component } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { HistoricalEntityData } from "../historical-entity-data";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Entity } from "../../../core/entity/entity";
import { sortByAttribute } from "../../../utils/utils";

@Component({
  selector: "app-historical-data",
  template: ` <app-entity-subrecord
    [records]="entries"
    [columns]="columns"
    [newRecordFactory]="getNewEntryFunction()"
  ></app-entity-subrecord>`,
})
export class HistoricalDataComponent implements OnInitDynamicComponent {
  entries: HistoricalEntityData[] = [];
  columns: ColumnDescription[] = [];
  private entity: Entity;

  constructor(private entityMapper: EntityMapperService) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.columns = config.config;
    const allEntries = await this.entityMapper.loadType(HistoricalEntityData);
    this.entries = allEntries
      .filter((entry) => entry.relatedEntity === this.entity.getId())
      .sort(sortByAttribute("date", "desc"));
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
