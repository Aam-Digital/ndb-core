import { MatTableDataSource } from "@angular/material/table";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { DestroyRef, effect, inject, signal } from "@angular/core";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { SortValueFns } from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import { LoaderMethod } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription } from "rxjs";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";

/**
 * Configuration object that is necessary if data should be loaded by the datasource
 */
export interface LoadRecordConfig<T extends Entity> {
  /**
   * Constructor of the entity type to be loaded
   */
  entityCtr: EntityConstructor<T>;
  /**
   * Set this if entities only related to another entity should be loaded
   */
  forEntity?: Entity;
  /**
   * Property through which the relation can be resolved
   */
  relationProperty?: keyof Entity;
  /**
   * Select if a special loader method should be used for this entity
   */
  loaderMethod?: LoaderMethod;
}

export abstract class EntitiesTableDataSource<
  T extends Entity,
> extends MatTableDataSource<TableRow<T>> {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly entityMapper = inject(EntityMapperService);
  private readonly bulkOperationState = inject(BulkOperationStateService);

  dataFilter = signal<DataFilter<T>>({});
  sortValueFns = signal<SortValueFns<T>>({});
  allRecords = signal<T[]>([]);
  filteredRecords = signal<T[]>([]);
  displayedData = signal<TableRow<T>[]>([]);
  loadRecordConfig = signal<LoadRecordConfig<T>>(undefined);
  isLoading = signal(false);

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

  // Make sure only one update subscription is active
  private updateSubscription: Subscription;

  protected constructor() {
    super();
    effect(() => {
      this.data = this.filteredRecords().map((record) => ({ record }));
    });
    effect(() => {
      if (this.loadRecordConfig()) {
        // If config is provided, this class loads the data and listens to updates
        this.setRecords();
        this.listenToEntityUpdates();
      }
    });
  }

  protected abstract setRecords(): Promise<any>;

  protected listenToEntityUpdates() {
    const entityConstructor = this.loadRecordConfig().entityCtr;
    if (!entityConstructor) {
      return;
    }

    this.updateSubscription?.unsubscribe();
    this.updateSubscription = this.entityMapper
      .receiveUpdates(entityConstructor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update) => this.handleUpdate(update));
  }

  private handleUpdate(updatedEntity: UpdatedEntity<T>) {
    if (this.bulkOperationState.isBulkOperationInProgress()) {
      return this.handleUpdateDuringBulkOperation(updatedEntity);
    }

    return this.processEntityUpdate(updatedEntity);
  }

  protected abstract processEntityUpdate(
    updatedEntity: UpdatedEntity<T>,
  ): Promise<any>;

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
      await this.setRecords();
      // Use setTimeout and requestAnimationFrame to detect when UI rendering is complete and inform the bulk action update
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.bulkOperationState.completeBulkOperation();
        });
      });
    }
  }
}
