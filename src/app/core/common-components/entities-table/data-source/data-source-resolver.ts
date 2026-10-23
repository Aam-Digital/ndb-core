import { Injector, runInInjectionContext, untracked } from "@angular/core";
import {
  availableDataSources,
  DataSourceType,
} from "#src/app/core/common-components/entities-table/data-source/available-data-sources";
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

export function resolveDataSource<T extends Entity>(
  injector: Injector,
  dataSource?: DataSourceType,
  loaderMethod?: LoaderMethod,
  entityType?: EntityConstructor,
): EntitiesTableDataSource<T> {
  const DataSourceClass = supportsPagination(injector)
    ? getDataSource(dataSource, loaderMethod, entityType)
    : InMemoryDataSource;
  return runInInjectionContext(injector, () =>
    untracked(() => new DataSourceClass<T>()),
  );
}

function supportsPagination(injector: Injector): boolean {
  if (environment.session_type !== SessionType.online) {
    // server-side pagination does not work against the local database
    return false;
  }

  // the database was created during startup and may not match a session_type changed afterwards
  if (!injector.get(DatabaseResolverService).getDatabase().supportsFind()) {
    Logging.warn(
      "session_type is online but the database does not support pagination; falling back to InMemoryDataSource",
    );
    return false;
  }

  return true;
}

function getDataSource(
  dataSource?: DataSourceType,
  loaderMethod?: LoaderMethod,
  entityType?: EntityConstructor,
) {
  if (dataSource && availableDataSources[dataSource]) {
    // an explicit config for this list takes precedence over any default
    return availableDataSources[dataSource];
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

  return (
    availableDataSources[environment.default_data_source] ??
    availableDataSources.paginated
  );
}
