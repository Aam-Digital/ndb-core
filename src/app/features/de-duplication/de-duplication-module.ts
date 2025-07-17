import { NgModule, inject } from "@angular/core";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";

@NgModule({})
export class DeDuplicationModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(dynamicComponents);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "BulkMergeRecordsComponent",
    () =>
      import("./bulk-merge-records/bulk-merge-records.component").then(
        (c) => c.BulkMergeRecordsComponent,
      ),
  ],
];
