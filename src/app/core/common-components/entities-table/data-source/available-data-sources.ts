import { InMemoryDataSource } from "#src/app/core/common-components/entities-table/data-source/in-memory-data-source";
import { PaginatedDataSource } from "#src/app/core/common-components/entities-table/data-source/paginated-data-source";

export const availableDataSources = {
  "in-memory": InMemoryDataSource,
  paginated: PaginatedDataSource,
};

export type DataSourceType = keyof typeof availableDataSources;
