import { Component } from "@angular/core";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../EntityDetailsConfig";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import {
  ColumnConfig,
  DataFilter,
} from "../../entity-subrecord/entity-subrecord/entity-subrecord-config";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { isArrayProperty } from "../../entity-utils/entity-utils";
import { EntitySubrecordComponent } from "../../entity-subrecord/entity-subrecord/entity-subrecord.component";

@DynamicComponent("RelatedEntities")
@Component({
  selector: "app-related-entities",
  templateUrl: "./related-entities.component.html",
  standalone: true,
  imports: [EntitySubrecordComponent],
})
export class RelatedEntitiesComponent implements OnInitDynamicComponent {
  data: Entity[] = [];
  columns: ColumnConfig[] = [];
  filter: DataFilter<Entity>;
  relatedEntity: Entity;
  private entityType: EntityConstructor;
  private property;
  private isArray = false;

  constructor(
    private entityMapper: EntityMapperService,
    private entities: EntityRegistry
  ) {}

  async onInitFromDynamicConfig(
    config: PanelConfig<{
      entity: string;
      property: string;
      columns: ColumnConfig[];
      filter?: DataFilter<Entity>;
    }>
  ) {
    this.relatedEntity = config.entity;
    this.entityType = this.entities.get(config.config.entity);
    this.property = config.config.property;
    this.isArray = isArrayProperty(this.entityType, this.property);

    this.data = await this.entityMapper.loadType(this.entityType);
    this.filter = {
      ...config.config.filter,
      [this.property]: this.isArray
        ? { $elemMatch: { $eq: this.relatedEntity.getId() } }
        : this.relatedEntity.getId(),
    };
    this.columns = config.config.columns;
  }

  createNewRecordFactory() {
    // TODO has a similar purpose like FilterService.alignEntityWithFilter
    return () => {
      const rec = new this.entityType();
      rec[this.property] = this.isArray
        ? [this.relatedEntity.getId()]
        : this.relatedEntity.getId();
      return rec;
    };
  }
}
