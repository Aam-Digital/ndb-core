import { Component, Input, OnInit, Optional } from "@angular/core";
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
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "../../entity/entity-special-loader/entity-special-loader.service";
import { CustomFormLinkButtonComponent } from "app/features/public-form/public-forms/custom-form-link-button/custom-form-link-button.component";
/**
 * Load and display a list of entity subrecords (entities related to the current entity details view).
 */
@DynamicComponent("RelatedEntities")
@UntilDestroy()
@Component({
  selector: "app-related-entities",
  templateUrl: "./related-entities.component.html",
  imports: [EntitiesTableComponent, CustomFormLinkButtonComponent],
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
   * If not explicitly set, this will be inferred based on the defined relations between the entities.
   *
   * manually setting this is only necessary if you have multiple properties referencing the same entity type
   * and you want to list only records related to one of them.
   * For example: if you set `entityType = "Project"` (to display a list of projects here) and the Project entities have a properties "participants" and "supervisors" both storing references to User entities,
   * you can set `property = "supervisors"` to only list those projects where the current User is supervisors, not participant.
   */
  @Input() property: string | string[];

  /**
   * The special service or method to load data via an index or other special method.
   */
  @Input() loaderMethod: LoaderMethod;

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

  @Input() clickMode: "popup" | "navigate" | "popup-details" = "popup";
  @Input() editable: boolean = true;

  data: E[];
  protected entityCtr: EntityConstructor<E>;

  constructor(
    protected entityMapper: EntityMapperService,
    private entityRegistry: EntityRegistry,
    private screenWidthObserver: ScreenWidthObserver,
    protected filterService: FilterService,
    @Optional() private entitySpecialLoader: EntitySpecialLoaderService,
  ) {
    this.screenWidthObserver
      .shared()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.updateColumnsToDisplayForScreenSize());
  }

  async ngOnInit() {
    this.property = this.property ?? this.getProperty();
    this.data = await this.getData();
    this.filter = this.initFilter();

    if (this.showInactive === undefined) {
      // show all related docs when visiting an archived entity
      this.showInactive = this.entity.anonymized;
    }

    this.listenToEntityUpdates();
  }

  protected getData(): Promise<E[]> {
    if (this.loaderMethod && this.entitySpecialLoader) {
      return this.entitySpecialLoader.loadDataFor(
        this.loaderMethod,
        this.entity,
      );
    }

    return this.entityMapper.loadType(this.entityCtr);
  }

  protected getProperty(): string | string[] {
    const relType = this.entity.getType();
    const found = [...this.entityCtr.schema].filter(([, field]) => {
      const entityDatatype = field.dataType === EntityDatatype.dataType;
      return entityDatatype && Array.isArray(field.additional)
        ? field.additional.includes(relType)
        : field.additional === relType;
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
    const isArray = this.entityCtr.schema.get(property).isArray;
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
    return () => {
      const rec = new this.entityCtr();
      this.filterService.alignEntityWithFilter(rec, this.filter);
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
