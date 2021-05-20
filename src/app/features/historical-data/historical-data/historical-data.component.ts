import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { HistoricalEntityData } from "../historical-entity-data";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Entity } from "../../../core/entity/entity";
import { HistoricalDataService } from "../historical-data.service";
import { EditPropertyConfig } from "../../../core/entity-components/entity-details/form/FormConfig";

/**
 * A general component that can be included on a entity details page through the config.
 * It loads all historical data related to that entity and displays it in a table.
 * The columns that are displayed can be configured according to the `ColumnDescription` interface
 */
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
  columns: EditPropertyConfig[] = [];
  private entity: Entity;

  constructor(private historicalDataService: HistoricalDataService) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.columns = config.config;
    this.entries = await this.historicalDataService.getHistoricalDataFor(
      this.entity.getId()
    );
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
