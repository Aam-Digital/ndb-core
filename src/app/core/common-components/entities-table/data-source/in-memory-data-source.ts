import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { effect, inject } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { FilterService } from "#src/app/core/filter/filter.service";
import { entityFilterPredicate } from "#src/app/core/filter/filter-generator/filter-predicate";
import { tableSort } from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import { EntitySpecialLoaderService } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import {
  applyUpdate,
  UpdatedEntity,
} from "#src/app/core/entity/model/entity-update";
import { skip } from "rxjs";
import { take } from "rxjs/operators";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/entities-table-data-source";

export class InMemoryDataSource<
  T extends Entity,
> extends EntitiesTableDataSource<T> {
  private readonly filterService = inject(FilterService);
  private readonly entitySpecialLoader = inject(EntitySpecialLoaderService, {
    optional: true,
  });

  override filterPredicate = (data: TableRow<T>, filter: string) =>
    entityFilterPredicate(data.record, filter);

  override sortData = (data, sort) =>
    tableSort<T, keyof T>(data, {
      active: (sort.active as keyof T) ?? "",
      direction: sort.direction,
      sortValueFns: this.sortValueFns(),
    });

  constructor() {
    super();
    // Wait for first change of `allRecords` to show that loading is done
    toObservable(this.allRecords)
      .pipe(skip(1), take(1))
      .subscribe(() => this.isLoading.set(false));

    effect(() => {
      const records = this.allRecords();
      const filter = this.dataFilter();
      const predicate = this.filterService.getFilterPredicate(filter);
      this.filteredRecords.set(records.filter(predicate));
    });
  }

  protected override setRecords(): Promise<any> {
    return this.getRecords().then((records) => this.allRecords.set(records));
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
    }

    const entityConstructor = this.loadRecordConfig().entityCtr;
    if (!entityConstructor) {
      return Promise.resolve([]);
    }
    return this.entityMapper.loadType(entityConstructor);
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
