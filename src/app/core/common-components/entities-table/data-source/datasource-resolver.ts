import { Injector, runInInjectionContext, untracked } from "@angular/core";
import {
  availableDataSources,
  DataSourceType,
} from "#src/app/core/common-components/entities-table/data-source/available-data-sources";
import { InMemoryDataSource } from "#src/app/core/common-components/entities-table/data-source/in-memory-data-source";
import { environment } from "#src/environments/environment";
import { SessionType } from "#src/app/core/session/session-type";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/entities-table-data-source";
import { Entity } from "#src/app/core/entity/model/entity";

export function resolveDataSource<T extends Entity>(
  injector: Injector,
  dataSource?: DataSourceType,
): EntitiesTableDataSource<T> {
  const DataSourceClass = getDataSource(dataSource);
  return runInInjectionContext(injector, () =>
    untracked(() => new DataSourceClass<T>()),
  );
}

function getDataSource(dataSource?: DataSourceType) {
  if (dataSource && availableDataSources[dataSource]) {
    return availableDataSources[dataSource];
  } else if (environment.session_type === SessionType.online) {
    return availableDataSources.paginated;
  } else {
    return InMemoryDataSource;
  }
}
