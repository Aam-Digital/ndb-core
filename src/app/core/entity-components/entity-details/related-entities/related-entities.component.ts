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

/**
 * Load and display a list of entity subrecords (entities related to the current entity details view).
 */
@DynamicComponent("RelatedEntities")
@Component({
  selector: "app-related-entities",
  templateUrl: "./related-entities.component.html",
  standalone: true,
  imports: [EntitySubrecordComponent],
})
export class RelatedEntitiesComponent<E extends Entity> implements OnInit {
  /** currently viewed/main entity for which related entities are displayed in this component */
  @Input() entity: Entity;

  /** entity type of the related entities to be displayed */
  @Input() entityType: string;

  /**
   * property name of the related entities (type given in this.entityType) that holds the entity id
   * to be matched with the id of the current main entity (given in this.entity)
   */
  @Input() property: string;

  @Input()
  public set columns(value: ColumnConfig[]) {
    this._columns = value;
  }
  public get columns(): ColumnConfig[] {
    return this._columns;
  }
  protected _columns: ColumnConfig[];

  @Input() filter?: DataFilter<E>;

  data: E[] = [];
  isLoading = false;
  private isArray = false;
  private entityCtr: EntityConstructor<E>;

  constructor(
    private entityMapper: EntityMapperService,
    private entities: EntityRegistry,
  ) {}

  async ngOnInit() {
    await this.initData();
  }

  protected async initData() {
    this.isLoading = true;

    this.entityCtr = this.entities.get(this.entityType) as EntityConstructor<E>;
    this.isArray = isArrayProperty(this.entityCtr, this.property);

    this.data = await this.entityMapper.loadType(this.entityType);
    this.filter = {
      ...this.filter,
      [this.property]: this.isArray
        ? { $elemMatch: { $eq: this.entity.getId() } }
        : this.entity.getId(),
    };

    this.isLoading = false;
  }

  createNewRecordFactory() {
    // TODO has a similar purpose like FilterService.alignEntityWithFilter
    return () => {
      const rec = new this.entityCtr();
      rec[this.property] = this.isArray
        ? [this.entity.getId()]
        : this.entity.getId();
      return rec;
    };
  }
}
