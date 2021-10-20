import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../entity-list/EntityListConfig";
import { Entity } from "../../../entity/model/entity";
import { Component, Input } from "@angular/core";

@Component({})
export abstract class ViewComponent implements OnInitDynamicComponent {
  @Input() entity: Entity;
  property: string;
  tooltip: string;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.entity = config.entity;
    this.property = config.id;
    this.tooltip = config.tooltip;
  }
}
