import { Injector, runInInjectionContext, untracked } from "@angular/core";
import {
  DataSourceConfig,
  DataSourceConstructor,
  DataSourceRegistry,
} from "#src/app/core/common-components/entities-table/data-source/data-source-registry";
import { PaginatedDataSource } from "#src/app/core/common-components/entities-table/data-source/paginated-data-source";
import { InMemoryDataSource } from "#src/app/core/common-components/entities-table/data-source/in-memory-data-source";
import { environment } from "#src/environments/environment";
import { SessionType } from "#src/app/core/session/session-type";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import {
  LoaderMethod,
  // aliased: this file has its own `supportsPagination`, which asks whether the
  // database can page at all rather than whether this loader serves pages
  supportsPagination as loaderSupportsPagination,
} from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Create the data source for a table.
 *
 * @param injector the injection context the data source lives in (and is destroyed with)
 * @param dataSource name of a data source in the {@link DataSourceRegistry}, or its name with options,
 *   as configured for the list
 * @param loaderMethod special loader the records come from, if any
 * @param entityType type of the listed records
 */
export function resolveDataSource<T extends Entity>(
  injector: Injector,
  dataSource?: string | DataSourceConfig,
  loaderMethod?: LoaderMethod,
  entityType?: EntityConstructor,
): EntitiesTableDataSource<T> {
  const { name, config }: Partial<DataSourceConfig> =
    typeof dataSource === "string" ? { name: dataSource } : (dataSource ?? {});
  const registry = injector.get(DataSourceRegistry);
  let DataSourceClass = getDataSource(registry, name, loaderMethod, entityType);
  if (pagesOnServer(DataSourceClass) && !supportsPagination(injector)) {
    DataSourceClass = InMemoryDataSource;
  }
  // options belong to the configured data source, not to a default or fallback
  const isConfiguredClass =
    !!name && registry.has(name) && registry.get(name) === DataSourceClass;
  return runInInjectionContext(injector, () =>
    untracked(() => {
      const instance = new DataSourceClass<T>();
      if (config && isConfiguredClass) {
        instance.config.set(config);
      }
      return instance;
    }),
  );
}

/**
 * Whether the data source loads its pages from the server, which only works in some sessions
 * (other data sources, e.g. registered by feature modules, work in every session).
 */
function pagesOnServer(DataSourceClass: DataSourceConstructor): boolean {
  return (
    DataSourceClass === PaginatedDataSource ||
    DataSourceClass.prototype instanceof PaginatedDataSource
  );
}

function supportsPagination(injector: Injector): boolean {
  if (environment.session_type !== SessionType.online) {
    // server-side pagination does not work against the local database
    return false;
  }

  // the database was created during startup and may not match a session_type changed afterwards
  if (!injector.get(DatabaseResolverService).getDatabase().supportsFind()) {
    // a normal fallback, the table still works
    Logging.debug(
      "session_type is online but the database does not support pagination; falling back to InMemoryDataSource",
    );
    return false;
  }

  return true;
}

function getDataSource(
  registry: DataSourceRegistry,
  dataSource?: string,
  loaderMethod?: LoaderMethod,
  entityType?: EntityConstructor,
): DataSourceConstructor {
  if (dataSource && registry.has(dataSource)) {
    // an explicit config for this list takes precedence over any default
    return registry.get(dataSource);
  }

  if (loaderMethod && !loaderSupportsPagination(loaderMethod)) {
    // a loader with no notion of a page loads everything it has, so the list
    // pages it in memory
    return InMemoryDataSource;
  }

  if (
    entityType?.isInternalEntity &&
    !loaderMethod &&
    TranslatableTextDatatype.detectFieldInEntity(
      entityType,
      TranslatableTextDatatype.dataType,
    )
  ) {
    // a small admin collection with translated texts: in memory the list sorts by
    // the displayed text, while the server-side sort of a paginated source would
    // sort the stored per-language map. Large internal types (e.g. audit records,
    // notifications) have no translated fields and keep paging.
    return InMemoryDataSource;
  }

  const defaultDataSource = environment.default_data_source;
  return defaultDataSource && registry.has(defaultDataSource)
    ? registry.get(defaultDataSource)
    : PaginatedDataSource;
}
