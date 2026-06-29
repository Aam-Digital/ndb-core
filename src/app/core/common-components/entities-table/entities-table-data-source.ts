import { DataSource } from "@angular/cdk/collections";
import { Signal, WritableSignal } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort, Sort } from "@angular/material/sort";
import { Entity } from "../../entity/model/entity";
import { DataFilter } from "../../filter/filters/filters";
import { FormFieldConfig } from "../entity-form/FormConfig";
import { TableRow } from "./table-row";


/**
 * Abstract base for data sources used by EntitiesTableComponent.
 * Defines the contract that both InMemoryDataSource and future server-side
 * data sources must fulfil, enabling dynamic switching at runtime.
 */
export abstract class EntitiesTableDataSource<
  T extends Entity,
> extends DataSource<TableRow<T>> {
  /** Records currently visible after filtering (before pagination). */
  abstract readonly filteredRecords: Signal<T[]>;
  /** True while an initial data load is in progress. */
  abstract readonly isLoading: Signal<boolean>;
  /** Filtered records wrapped in TableRow and sorted. */
  abstract readonly sortedRows: Signal<TableRow<T>[]>;
  /**
   * Column definitions with sorting rules applied (noSorting flag set where
   * appropriate). Used by the table template to render sort headers.
   */
  abstract readonly columns: Signal<FormFieldConfig[]>;
  /** The currently active sort (user-set, URL-restored, external, or inferred default). */
  abstract readonly effectiveSort: Signal<Sort | undefined>;

  /** Structured domain filter applied to the data. */
  abstract readonly filter: WritableSignal<DataFilter<T>>;
  /** Free-text search string applied on top of the domain filter. */
  abstract readonly filterFreetext: WritableSignal<string>;
  /** When true, inactive (archived) records are included in the result. */
  abstract readonly showInactive: WritableSignal<boolean>;

  /** Attach the Angular Material sort component for user-triggered sorting. */
  abstract attachSort(sort: MatSort): void;
  /** Attach the Angular Material paginator for page-based navigation. */
  abstract attachPaginator(paginator: MatPaginator): void;
  /**
   * Provide column definitions so the data source can infer default sort order
   * and build per-column sort-value functions.
   */
  abstract connectColumns(
    columnsToDisplay: Signal<string[]>,
    columns: Signal<FormFieldConfig[]>,
    externalSort: Signal<Sort | undefined>,
  ): void;
}
