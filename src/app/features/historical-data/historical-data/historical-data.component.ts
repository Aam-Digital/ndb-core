import { Component, Input, OnInit } from "@angular/core";
import { HistoricalEntityData } from "../model/historical-entity-data";
import { Entity } from "../../../core/entity/model/entity";
import { HistoricalDataService } from "../historical-data.service";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

/**
 * A general component that can be included on a entity details page through the config.
 * It loads all historical data related to that entity and displays it in a table.
 * The columns that are displayed can be configured according to the `ColumnDescription` interface
 */
@DynamicComponent("HistoricalDataComponent")
@Component({
  selector: "app-historical-data",
  template: ` <app-entity-subrecord
    [records]="entries"
    [columns]="config"
    [newRecordFactory]="getNewEntryFunction()"
  ></app-entity-subrecord>`,
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class HistoricalDataComponent implements OnInit {
  @Input() entity: Entity;
  @Input() config: FormFieldConfig[] = [];
  entries: HistoricalEntityData[] = [];

  constructor(private historicalDataService: HistoricalDataService) {}

  async ngOnInit() {
    this.entries = await this.historicalDataService.getHistoricalDataFor(
      this.entity.getId(),
    );
  }

  public getNewEntryFunction(): () => HistoricalEntityData {
    return () => {
      const newEntry = new HistoricalEntityData();
      newEntry.relatedEntity = this.entity.getId();
      return newEntry;
    };
  }
}
