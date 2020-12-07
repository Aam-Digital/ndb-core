import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-children-list",
  template: `
    <app-child-block
      *ngFor="let child of children"
      [entityId]="child"
    ></app-child-block>
  `,
})
export class ChildrenListComponent implements OnInitDynamicComponent {
  public children: string[] = [];

  constructor() {}

  onInitFromDynamicConfig(config: any) {
    this.children = config.entity[config.id];
  }
}
