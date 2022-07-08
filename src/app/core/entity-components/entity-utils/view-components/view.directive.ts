import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../entity-list/EntityListConfig";
import { Entity } from "../../../entity/model/entity";
import { Directive, Input } from "@angular/core";

@Directive()
export abstract class ViewDirective<T> implements OnInitDynamicComponent {
  @Input() entity: Entity;
  property: string;
  tooltip: string;
  value: T;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.entity = config.entity;
    this.value = config.value;
    this.property = config.id;
    this.tooltip = config.tooltip;
  }
}
