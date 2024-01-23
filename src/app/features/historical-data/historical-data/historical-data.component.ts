import { Component, Input, OnInit } from "@angular/core";
import { HistoricalEntityData } from "../model/historical-entity-data";
import { Entity } from "../../../core/entity/model/entity";
import { HistoricalDataService } from "../historical-data.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";

/**
 * A general component that can be included on a entity details page through the config.
 * It loads all historical data related to that entity and displays it in a table.
 * The columns that are displayed can be configured according to the `ColumnDescription` interface
 */
@DynamicComponent("HistoricalDataComponent")
@Component({
  selector: "app-historical-data",
  templateUrl:
    "../../../core/entity-details/related-entities/related-entities.component.html",
  imports: [EntitiesTableComponent],
  standalone: true,
})
export class HistoricalDataComponent
  extends RelatedEntitiesComponent<HistoricalEntityData>
  implements OnInit
{
  @Input() entity: Entity;
  property = "relatedEntity";
  entityCtr = HistoricalEntityData;

  /** @deprecated use @Input() columns instead */
  @Input() set config(value: FormFieldConfig[]) {
    if (Array.isArray(value)) {
      this.columns = value;
    }
  }

  constructor(
    private historicalDataService: HistoricalDataService,
    entityMapper: EntityMapperService,
    entityRegistry: EntityRegistry,
    screenWidthObserver: ScreenWidthObserver,
  ) {
    super(entityMapper, entityRegistry, screenWidthObserver);
  }

  override getData() {
    return this.historicalDataService.getHistoricalDataFor(this.entity.getId());
  }

  public getNewEntryFunction(): () => HistoricalEntityData {
    return () => {
      const newEntry = new HistoricalEntityData();
      newEntry.relatedEntity = this.entity.getId();
      return newEntry;
    };
  }
}
