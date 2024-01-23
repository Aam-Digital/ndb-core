import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { isArrayProperty } from "../../basic-datatypes/datatype-utils";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { applyUpdate } from "../../entity/model/entity-update";
import {
  ScreenSize,
  ScreenWidthObserver,
} from "../../../utils/media/screen-size-observer.service";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { DataFilter } from "../../filter/filters/filters";
import { FilterService } from "../../filter/filter.service";

/**
 * Load and display a list of entity subrecords (entities related to the current entity details view).
 */
@DynamicComponent("RelatedEntities")
@UntilDestroy()
@Component({
  selector: "app-related-entities",
  templateUrl: "./related-entities.component.html",
  standalone: true,
  imports: [EntitiesTableComponent],
})
export class RelatedEntitiesComponent<E extends Entity> implements OnInit {
  /** currently viewed/main entity for which related entities are displayed in this component */
  @Input() entity: Entity;

  /** entity type of the related entities to be displayed */
  @Input() set entityType(value: string) {
    this.entityCtr = this.entityRegistry.get(value) as EntityConstructor<E>;
  }

  /**
   * property name of the related entities (type given in this.entityType) that holds the entity id
   * to be matched with the id of the current main entity (given in this.entity)
   */
  @Input() property: string;

  @Input()
  public set columns(value: ColumnConfig[]) {
    if (!Array.isArray(value)) {
      return;
    }

    this._columns = value.map((c) => toFormFieldConfig(c));
    this.updateColumnsToDisplayForScreenSize();
  }
  protected _columns: FormFieldConfig[];

  columnsToDisplay: string[];

  @Input() filter?: DataFilter<E>;

  @Input() showInactive: boolean;

  data: E[];
  private isArray = false;
  protected entityCtr: EntityConstructor<E>;

  constructor(
    protected entityMapper: EntityMapperService,
    private entityRegistry: EntityRegistry,
    private screenWidthObserver: ScreenWidthObserver,
    protected filterService: FilterService,
  ) {
    this.screenWidthObserver
      .shared()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.updateColumnsToDisplayForScreenSize());
  }

  async ngOnInit() {
    const data = await this.getData();
    this.filter = this.initFilter();
    this.data = data.filter(this.filterService.getFilterPredicate(this.filter));
    this.listenToEntityUpdates();
  }

  protected async getData(): Promise<E[]> {
    this.isArray = isArrayProperty(this.entityCtr, this.property);

    const data = await this.entityMapper.loadType<E>(this.entityCtr);

    if (this.showInactive === undefined) {
      this.showInactive = this.entity.anonymized;
    }
    return data;
  }

  initFilter(): DataFilter<E> {
    const filter: DataFilter<E> = { ...this.filter };

    if (this.property) {
      // only show related entities
      filter[this.property] = this.isArray
        ? { $elemMatch: { $eq: this.entity.getId() } }
        : this.entity.getId();
    }

    return filter;
  }

  protected listenToEntityUpdates() {
    this.entityMapper
      .receiveUpdates(this.entityCtr)
      .pipe(untilDestroyed(this))
      .subscribe((next) => {
        this.data = applyUpdate(this.data, next);
      });
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

  private updateColumnsToDisplayForScreenSize() {
    if (!this._columns) {
      return;
    }

    this.columnsToDisplay = this._columns
      .filter((column) => {
        if (column?.hideFromTable) {
          return false;
        }

        const numericValue = ScreenSize[column?.visibleFrom];
        if (numericValue === undefined) {
          return true;
        }
        return this.screenWidthObserver.currentScreenSize() >= numericValue;
      })
      .map((c) => c.id);
  }
}
