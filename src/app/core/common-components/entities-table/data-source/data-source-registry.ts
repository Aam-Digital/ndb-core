import { Injectable } from "@angular/core";
import { Registry } from "#src/app/core/config/registry/dynamic-registry";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitiesTableDataSource } from "./entities-table-data-source";
import { InMemoryDataSource } from "./in-memory-data-source";
import { PaginatedDataSource } from "./paginated-data-source";

/** A concrete data source class, created in an injection context by `resolveDataSource`. */
export type DataSourceConstructor = new <
  T extends Entity,
>() => EntitiesTableDataSource<T>;

/**
 * A data source named in a list or section config together with options for it:
 * `"dataSource": { "name": "my-feature", "config": { "someOption": true } }`.
 * (A plain name, `"dataSource": "my-feature"`, is the same without options.)
 */
export interface DataSourceConfig<C extends object = Record<string, unknown>> {
  /** name of the data source in the {@link DataSourceRegistry} */
  name: string;
  /** options that the data source reads itself (see `EntitiesTableDataSource.config`) */
  config?: C;
}

/**
 * The data sources that the `dataSource` of a list or related-entities config can name.
 *
 * Core registers "in-memory" and "paginated" here,
 * feature modules add their own data sources in their module:
 * ```
 * inject(DataSourceRegistry).add("my-feature", MyFeatureDataSource);
 * ```
 */
@Injectable({ providedIn: "root" })
export class DataSourceRegistry extends Registry<DataSourceConstructor> {
  protected override readonly registryName = "DataSourceRegistry";

  constructor() {
    super();
    this.addAll([
      ["in-memory", InMemoryDataSource],
      ["paginated", PaginatedDataSource],
    ]);
  }
}
