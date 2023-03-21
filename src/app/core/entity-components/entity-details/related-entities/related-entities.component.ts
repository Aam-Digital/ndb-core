import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
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
export class RelatedEntitiesComponent implements OnInit {
  data: Entity[] = [];
  filter: DataFilter<Entity>;
  @Input() entity: Entity;
  @Input() config: {
    entity: string;
    property: string;
    columns: ColumnConfig[];
    filter?: DataFilter<Entity>;
  };
  private isArray = false;
  private entityType: EntityConstructor;

  constructor(
    private entityMapper: EntityMapperService,
    private entities: EntityRegistry
  ) {}

  async ngOnInit() {
    this.entityType = this.entities.get(this.config.entity);
    this.isArray = isArrayProperty(this.entityType, this.config.property);

    this.data = await this.entityMapper.loadType(this.entityType);
    this.filter = {
      ...this.config.filter,
      [this.config.property]: this.isArray
        ? { $elemMatch: { $eq: this.entity.getId() } }
        : this.entity.getId(),
    };
  }

  createNewRecordFactory() {
    // TODO has a similar purpose like FilterService.alignEntityWithFilter
    return () => {
      const rec = new this.entityType();
      rec[this.config.property] = this.isArray
        ? [this.entity.getId()]
        : this.entity.getId();
      return rec;
    };
  }
}
