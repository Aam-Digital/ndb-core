import { MatTableDataSource } from "@angular/material/table";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { DestroyRef, effect, inject, signal } from "@angular/core";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { SortValueFns } from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import { LoaderMethod } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { Subject, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { isExpiredSessionError } from "#src/app/utils/expired-session-error";
import { isNotPermittedError } from "#src/app/utils/not-permitted-error";
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";

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
   * Property through which the relation to `forEntity` can be resolved,
   * or several candidates if it cannot be determined unambiguously
   */
  relationProperty?: string | string[];
  /**
   * Select if a special loader method should be used for this entity
   */
  loaderMethod?: LoaderMethod;
}

/** Why loading the records of a list failed, as named to the user. */
type LoadErrorCause = "connection" | "sessionExpired" | "notPermitted";

/**
 * Abstract data source for tables that handles all data handling internally.
 * Depending on the environment all data might be in-memory or only requested from the server on demand.
 */
export abstract class EntitiesTableDataSource<
  T extends Entity,
> extends MatTableDataSource<TableRow<T>> {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly entityMapper = inject(EntityMapperService);
  private readonly bulkOperationState = inject(BulkOperationStateService);
  private readonly snackBar = inject(MatSnackBar);

  /** Reference to the currently shown "could not load data" toast, if any. */
  private loadErrorSnackBarRef?: MatSnackBarRef<TextOnlySnackBar>;

  dataFilter = signal<DataFilter<T>>({});
  sortValueFns = signal<SortValueFns<T>>({});
  allRecords = signal<T[]>([]);
  filteredRecords = signal<T[]>([]);
  /**
   * The rows handed to the table as input data, in the order they were loaded.
   * Sorting and pagination are applied on top of this by the table, see {@link renderedRows}.
   */
  displayedData = signal<TableRow<T>[]>([]);
  /**
   * The rows as currently rendered by the table:
   * filtered, sorted and reduced to the current page.
   */
  readonly renderedRows = toSignal(this.connect(), { requireSync: true });
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
    effect(() => {
      // got to first page if filter changes
      this.dataFilter();
      this.paginator?.firstPage();
    });

    // Coalesce the many triggers that fire while a view initializes
    // (config, default + url-param filters, sort, paginator) into a single load.
    this.reloadTrigger
      .pipe(debounceTime(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.executeLoad());
  }

  /** Emits whenever a (re)load of the records is requested, see {@link setRecords}. */
  private readonly reloadTrigger = new Subject<void>();
  /** Awaiters of the currently scheduled (not yet executed) load. */
  private pendingReload?: {
    /** Will resolve with the requested data */
    promise: Promise<any>;
    /** Resolver function for the above promise */
    resolve: (value: Promise<any>) => void;
  };

  /**
   * Incremented whenever a new configuration triggers loading of new data.
   * This allows stale requests to be detected.
   */
  protected loadGeneration = 0;

  /**
   * Request a (re)load of the records for the current config/filter/sort/page.
   *
   * All the triggers that fire while a view initializes are debounced into a
   * single request, so opening a list does not send several redundant DB
   * requests (and the request already uses the fully resolved filter/sort/page).
   * {@link isLoading} is set immediately so the table can show a progress
   * indicator until the load finishes.
   *
   * @returns a promise that resolves once the resulting load has completed.
   */
  protected setRecords(): Promise<any> {
    this.isLoading.set(true);
    if (!this.pendingReload) {
      let resolve!: (value: Promise<any>) => void;
      const promise = new Promise((res) => (resolve = res));
      this.pendingReload = { promise, resolve };
    }
    this.reloadTrigger.next();
    return this.pendingReload.promise;
  }

  private executeLoad(): void {
    const reload = this.pendingReload;
    this.pendingReload = undefined;
    const generation = ++this.loadGeneration;
    const isCurrentLoad = () => generation === this.loadGeneration;
    const load = this.loadRecords()
      .then((data) => {
        if (isCurrentLoad()) {
          // a previous failure has now recovered
          this.loadErrorSnackBarRef?.dismiss();
          this.loadErrorSnackBarRef = undefined;
        }
        return data;
      })
      .catch((err) => {
        let cause: LoadErrorCause = "connection";
        if (isNotPermittedError(err)) {
          // a permission rule excludes these records for the user, not an app error
          cause = "notPermitted";
          Logging.debug(
            "User is not permitted to load data in datasource",
            err,
          );
        } else {
          if (isExpiredSessionError(err)) {
            cause = "sessionExpired";
          }
          Logging.error(
            "Error loading data in datasource",
            err,
            this.loadRecordConfig(),
          );
        }
        if (isCurrentLoad()) {
          // replaces any session alert shown for the same failure (one snackbar
          // at a time), so it has to name that cause itself
          this.showLoadErrorToast(cause);
        }
        return [];
      })
      .finally(() => {
        if (isCurrentLoad()) {
          this.isLoading.set(false);
        }
      });
    // let awaiters (e.g. bulk operations) adopt the actual load's outcome
    reload?.resolve(load);
  }

  /**
   * Notify the user that the list could not be loaded and (unless not permitted) offer a manual retry.
   * The retry routes through {@link setRecords} so it reuses the normal
   * (debounced, `isLoading`-tracked) reload path.
   *
   * @param cause why the server rejected the request: the user may not access these records,
   *   the login session expired and could not be renewed, or (default) a connection problem
   */
  private showLoadErrorToast(cause: LoadErrorCause = "connection"): void {
    this.loadErrorSnackBarRef?.dismiss();
    const messages = {
      notPermitted: $localize`:Table data loading failed because the user is not permitted:Could not load the list because you don't have access to these records.`,
      sessionExpired: $localize`:Table data loading failed because the login session expired:Could not load the list because your login session has expired and could not be renewed. Please try again later.`,
      connection: $localize`:Table data loading failed:Could not load the list. Please check your internet connection.`,
    };
    const message = messages[cause];
    // retrying cannot help if the user is not permitted: only offer to dismiss the message
    const canRetry = cause !== "notPermitted";
    this.loadErrorSnackBarRef = this.snackBar.open(
      message,
      canRetry ? $localize`:Retry loading table data:Retry` : "×",
      { duration: 3600000 },
    );
    if (canRetry) {
      this.loadErrorSnackBarRef
        .onAction()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.setRecords());
    }
  }

  /** Actually (re)load the records. Implemented by the concrete data source. */
  protected abstract loadRecords(): Promise<any>;

  /**
   * Load the full set of records (independent of the currently displayed page),
   * for use cases like export that need all data rather than only what is currently rendered.
   * @param filtered Whether to apply the current `dataFilter`, or return unfiltered records
   */
  abstract getAllData(filtered?: boolean): Promise<T[]>;

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
