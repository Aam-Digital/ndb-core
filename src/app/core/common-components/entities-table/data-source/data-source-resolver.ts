import { Injector, runInInjectionContext, untracked } from "@angular/core";
import {
  availableDataSources,
  DataSourceType,
} from "#src/app/core/common-components/entities-table/data-source/available-data-sources";
import { InMemoryDataSource } from "#src/app/core/common-components/entities-table/data-source/in-memory-data-source";
import { environment } from "#src/environments/environment";
import { SessionType } from "#src/app/core/session/session-type";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { Entity } from "#src/app/core/entity/model/entity";
import { LoaderMethod } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";

export function resolveDataSource<T extends Entity>(
  injector: Injector,
  dataSource?: DataSourceType,
  loaderMethod?: LoaderMethod,
): EntitiesTableDataSource<T> {
  const DataSourceClass = getDataSource(dataSource, loaderMethod);
  return runInInjectionContext(injector, () =>
    untracked(() => new DataSourceClass<T>()),
  );
}

function getDataSource(
  dataSource?: DataSourceType,
  loaderMethod?: LoaderMethod,
) {
  if (dataSource && availableDataSources[dataSource]) {
    // an explicit config for this list takes precedence over any default
    return availableDataSources[dataSource];
  }

  if (loaderMethod) {
    // special loaders are not supported by the paginated data source
    return InMemoryDataSource;
  }

  const systemDefault = availableDataSources[environment.default_data_source];
  if (systemDefault) {
    return systemDefault;
  }

  // without a system-wide default, only online-only mode paginates server-side
  return environment.session_type === SessionType.online
    ? availableDataSources.paginated
    : InMemoryDataSource;
}
