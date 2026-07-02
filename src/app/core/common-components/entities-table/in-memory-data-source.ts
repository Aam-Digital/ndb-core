import { Entity, EntityConstructor } from "../../entity/model/entity";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatTableDataSource } from "@angular/material/table";
import { DestroyRef, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FilterService } from "#src/app/core/filter/filter.service";
import { entityFilterPredicate } from "#src/app/core/filter/filter-generator/filter-predicate";
import {
  SortValueFns,
  tableSort,
} from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import {
  applyUpdate,
  UpdatedEntity,
} from "#src/app/core/entity/model/entity-update";
import { skip, Subscription } from "rxjs";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";
import { take } from "rxjs/operators";

export interface LoadRecordConfig<T extends Entity> {
  entityCtr: EntityConstructor<T>;
  forEntity?: Entity;
  relationProperty?: keyof Entity;
  loaderMethod?: LoaderMethod;
}

export class InMemoryDataSource<T extends Entity> extends MatTableDataSource<
  TableRow<T>
> {
  private readonly filterService = inject(FilterService);
  private readonly entitySpecialLoader = inject(EntitySpecialLoaderService, {
    optional: true,
  });
  private readonly entityMapper = inject(EntityMapperService);
  private readonly bulkOperationState = inject(BulkOperationStateService);
  private readonly destroyRef = inject(DestroyRef);

  dataFilter = signal<DataFilter<T>>({});
  sortValueFns = signal<SortValueFns<T>>({});
  allRecords = signal<T[]>([]);
  filteredRecords = signal<T[]>([]);
  displayedData = signal<TableRow<T>[]>([]);
  loadRecordConfig = signal<LoadRecordConfig<T>>(undefined);
  isLoading = signal(true);

  // NOTE: overriding only the setter would hide the inherited `get data`,
  // so `dataSource.data` would return `undefined`. Provide both accessors.
  override get data(): TableRow<T>[] {
    return super.data;
  }

  override set data(data: TableRow<T>[]) {
    // expose signal containing current data
    this.displayedData.set(data);
    super.data = data;
  }

  override filterPredicate = (data: TableRow<T>, filter: string) =>
    entityFilterPredicate(data.record, filter);

  override sortData = (data, sort) =>
    tableSort<T, keyof T>(data, {
      active: (sort.active as keyof T) ?? "",
      direction: sort.direction,
      sortValueFns: this.sortValueFns(),
    });

  // Make sure only one update subscription is active
  private updateSubscription: Subscription;

  constructor() {
    super();
    // Wait for first change of `allRecords` to show that loading is done
    toObservable(this.allRecords)
      .pipe(skip(1), take(1))
      .subscribe(() => this.isLoading.set(false));

    effect(() => {
      this.data = this.filteredRecords().map((record) => ({ record }));
    });
    effect(() => {
      const records = this.allRecords();
      const filter = this.dataFilter();
      const predicate = this.filterService.getFilterPredicate(filter);
      this.filteredRecords.set(records.filter(predicate));
    });
    effect(() => {
      if (this.loadRecordConfig()) {
        // If config is provided, this class loads the data and listens to updates
        this.getRecords().then((records) => this.allRecords.set(records));
        this.listenToEntityUpdates();
      }
    });
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

  private listenToEntityUpdates() {
    const entityConstructor = this.loadRecordConfig().entityCtr;
    if (!entityConstructor) {
      return;
    }

    this.updateSubscription?.unsubscribe();
    this.updateSubscription = this.entityMapper
      .receiveUpdates(entityConstructor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (updatedEntity: UpdatedEntity<T>) => {
        if (this.bulkOperationState.isBulkOperationInProgress()) {
          await this.handleUpdateDuringBulkOperation(updatedEntity);
          return;
        }

        //get specially enhanced entity if necessary
        const loaderMethod = this.loadRecordConfig().loaderMethod;
        if (loaderMethod && this.entitySpecialLoader) {
          updatedEntity = await this.entitySpecialLoader.extendUpdatedEntity(
            loaderMethod,
            updatedEntity,
          );
        }
        this.allRecords.set(applyUpdate(this.allRecords(), updatedEntity));
      });
  }

  private async handleUpdateDuringBulkOperation(
    updatedEntity: UpdatedEntity<T>,
  ) {
    //buffer updates during bulk operations to avoid UI performance issues
    const inProgress = this.bulkOperationState.updateBulkOperationProgress(
      updatedEntity,
      false,
    );
    if (!inProgress) {
      // reload the list once
      this.allRecords.set(await this.getRecords());
      // Use setTimeout and requestAnimationFrame to detect when UI rendering is complete and inform the bulk action update
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.bulkOperationState.completeBulkOperation();
        });
      });
    }
  }
}
