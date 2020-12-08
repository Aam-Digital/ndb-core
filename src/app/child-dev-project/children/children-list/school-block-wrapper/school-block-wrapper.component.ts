import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-school-block-wrapper",
  template: `<app-school-block [entityId]="schoolId"></app-school-block>`,
})
export class SchoolBlockWrapperComponent implements OnInitDynamicComponent {
  public schoolId: string;

  constructor() {}

  onInitFromDynamicConfig(config: any) {
    this.schoolId = config.entity.schoolId;
  }
}
