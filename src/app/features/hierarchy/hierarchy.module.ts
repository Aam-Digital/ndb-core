import { inject, NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { hierarchyComponents } from "./hierarchy-components";
import { DataSourceRegistry } from "#src/app/core/common-components/entities-table/data-source/data-source-registry";
import { HierarchyDataSource } from "./hierarchy-data-source";

/**
 * Lists and related-entities sections that show records indented below their parent records.
 * See README.md in this folder.
 */
@NgModule({})
export class HierarchyModule {
  constructor() {
    inject(DataSourceRegistry).add(
      HierarchyDataSource.DATA_SOURCE_NAME,
      HierarchyDataSource,
    );
    inject(ComponentRegistry).addAll(hierarchyComponents);
  }
}
