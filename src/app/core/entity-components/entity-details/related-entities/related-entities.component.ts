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
export class RelatedEntitiesComponent<E extends Entity> implements OnInit {
  data: E[] = [];
  @Input() entity: Entity;
  @Input() entityType: string;
  @Input() property: string;

  @Input() set columns(value: ColumnConfig[]) {
    this._columns = value;
  }
  get columns(): ColumnConfig[] {
    return this._columns;
  }
  protected _columns: ColumnConfig[];

  @Input() filter?: DataFilter<any>; // TODO: somehow subrecord-entities doesn't accept DataFilter<E> here ...
  private isArray = false;
  private entityCtr: EntityConstructor;
  isLoading = false;

  constructor(
    private entityMapper: EntityMapperService,
    private entities: EntityRegistry,
  ) {}

  async ngOnInit() {
    await this.initData();
  }

  protected async initData() {
    this.isLoading = true;

    this.entityCtr = this.entities.get(this.entityType);
    this.isArray = isArrayProperty(this.entityCtr, this.property);

    this.data = (await this.entityMapper.loadType<E>(this.entityType)).filter(
      (d) =>
        this.isArray
          ? d[this.property].includes(this.entity.getId())
          : d[this.property] === this.entity.getId(),
    );
    // TODO: why did we previously choose to use this.filter rather than what seems a bit more simple directly filtering before assigning docs to this.data?

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
