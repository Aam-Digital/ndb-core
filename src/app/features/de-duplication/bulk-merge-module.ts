import { NgModule } from "@angular/core";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";

@NgModule({})
export class BulkMergeModule {
  constructor(components: ComponentRegistry) {
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
