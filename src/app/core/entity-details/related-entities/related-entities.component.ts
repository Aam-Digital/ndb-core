import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
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
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { EntityArrayDatatype } from "../../basic-datatypes/entity-array/entity-array.datatype";
import { isArrayProperty } from "../../basic-datatypes/datatype-utils";

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
   * Property name of the related entities (type given in this.entityType) that holds the entity id
   * to be matched with the id of the current main entity (given in this.entity).
   * This is automatically inferred and does not need to be set.
   */
  protected property: string | string[];

  /**
   * Columns to be displayed in the table
   * @param value
   */
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

  /**
   * This filter is applied before displaying the data.
   */
  @Input() filter?: DataFilter<E>;

  /**
   * Whether inactive/archived records should be shown.
   */
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
    this.property = this.getProperty();
    this.data = await this.getData();
    this.filter = this.initFilter();

    if (this.showInactive === undefined) {
      // show all related docs when visiting an archived entity
      this.showInactive = this.entity.anonymized;
    }

    this.listenToEntityUpdates();
  }

  protected getData(): Promise<E[]> {
    return this.entityMapper.loadType(this.entityCtr);
  }

  protected getProperty(): string | string[] {
    const relType = this.entity.getType();
    const found = [...this.entityCtr.schema].filter(([prop, schema]) => {
      const additional = schema.additional;
      switch (schema.dataType) {
        case EntityDatatype.dataType:
        case EntityArrayDatatype.dataType:
          return Array.isArray(additional)
            ? additional.includes(relType)
            : additional === relType;
      }
    });
    return found.length === 1 ? found[0][0] : found.map(([key]) => key);
  }

  protected initFilter(): DataFilter<E> {
    const filter: DataFilter<E> = { ...this.filter };

    if (this.property) {
      // only show related entities
      if (typeof this.property === "string") {
        Object.assign(filter, this.getFilterForProperty(this.property));
      } else if (this.property.length > 0) {
        filter["$or"] = this.property.map((prop) =>
          this.getFilterForProperty(prop),
        );
      }
    }

    return filter;
  }

  private getFilterForProperty(property: string) {
    // TODO doesnt work with full ids
    const isArray = isArrayProperty(this.entityCtr, property);
    const filter = isArray
      ? { $elemMatch: { $eq: this.entity.getId() } }
      : this.entity.getId();
    return { [property]: filter };
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
      if (!Array.isArray(this.property)) {
        rec[this.property] = this.isArray
          ? [this.entity.getId()]
          : this.entity.getId();
      }
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
