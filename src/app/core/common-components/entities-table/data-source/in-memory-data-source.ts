import { effect, inject, Signal, signal } from "@angular/core";
import { FilterService } from "#src/app/core/filter/filter.service";
import { entityFilterPredicate } from "#src/app/core/filter/filter-generator/filter-predicate";
import { tableSort } from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import { EntitySpecialLoaderService } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import {
  applyUpdate,
  UpdatedEntity,
} from "#src/app/core/entity/model/entity-update";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { DynamicComponentConfig } from "#src/app/core/config/dynamic-components/dynamic-component-config.interface";

/**
 * A data source that loads all data at once and sort/filters/paginates fully in-memory.
 * It also applies the free-text {@link searchText} and offers the field to enter it as toolbar control.
 */
export class InMemoryDataSource<
  T extends Entity,
> extends EntitiesTableDataSource<T> {
  private readonly filterService = inject(FilterService);
  private readonly entitySpecialLoader = inject(EntitySpecialLoaderService, {
    optional: true,
  });

  /** the "Filter" field to enter the {@link searchText}, for subclasses that offer further toolbar controls */
  protected readonly freeTextFilterControl: DynamicComponentConfig = {
    component: "FreeTextFilter",
    config: { dataSource: this },
  };

  override readonly toolbarControls: Signal<DynamicComponentConfig[]> = signal([
    this.freeTextFilterControl,
  ]);

  override sortData = (data, sort) =>
    tableSort<T, keyof T>(data, {
      active: (sort.active as keyof T) ?? "",
      direction: sort.direction,
      sortValueFns: this.sortValueFns(),
    });

  constructor() {
    super();
    effect(() => {
      const records = this.allRecords();
      const predicate = this.getFilterPredicate(this.dataFilter());
      const searchText = this.searchText().trim().toLowerCase();
      this.filteredRecords.set(
        records.filter(
          (record) =>
            predicate(record) &&
            (!searchText || entityFilterPredicate(record, searchText)),
        ),
      );
    });
  }

  /**
   * Whether a record passes the given filter (the free-text search is applied on top of it).
   * Data sources of feature modules can override this to narrow or reinterpret the filter;
   * signals read here are tracked, so a change of them filters the records again.
   */
  protected getFilterPredicate(filter: DataFilter<T>): (record: T) => boolean {
    return this.filterService.getFilterPredicate(filter);
  }

  protected override loadRecords(): Promise<any> {
    return this.getRecords().then((records) => this.allRecords.set(records));
  }

  override async getAllData(filtered = false): Promise<T[]> {
    if (!filtered) {
      return this.allRecords();
    }

    // including the free-text search
    return [...this.filteredRecords()];
  }

  private getRecords() {
    const loaderMethod = this.loadRecordConfig().loaderMethod;
    if (loaderMethod && this.entitySpecialLoader) {
      const forEntity = this.loadRecordConfig().forEntity;
      if (forEntity) {
        return this.entitySpecialLoader.loadDataFor(
          loaderMethod,
          forEntity,
          this.loadRecordConfig().relationProperty,
        );
      } else {
        return this.entitySpecialLoader.loadData(loaderMethod);
      }
    } else {
      const entityConstructor = this.loadRecordConfig().entityCtr;
      if (!entityConstructor) {
        return Promise.resolve([]);
      }
      return this.entityMapper.loadType(entityConstructor);
    }
  }

  protected override async processEntityUpdate(
    updatedEntity: UpdatedEntity<T>,
  ) {
    //get specially enhanced entity if necessary
    const loaderMethod = this.loadRecordConfig().loaderMethod;
    if (loaderMethod && this.entitySpecialLoader) {
      updatedEntity = await this.entitySpecialLoader.extendUpdatedEntity(
        loaderMethod,
        updatedEntity,
      );
    }
    this.allRecords.set(applyUpdate(this.allRecords(), updatedEntity));
  }
}
