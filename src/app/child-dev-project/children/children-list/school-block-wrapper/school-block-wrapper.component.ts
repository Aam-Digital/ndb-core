import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Child } from "../../model/child";
import { ColumnCellConfig } from "../../../../core/entity-components/entity-list/EntityListConfig";

@Component({
  selector: "app-school-block-wrapper",
  template: `<app-school-block [entityId]="schoolId"></app-school-block>`,
})
export class SchoolBlockWrapperComponent implements OnInitDynamicComponent {
  public schoolId: string;

  constructor() {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.schoolId = (config.entity as Child).schoolId;
  }
}
