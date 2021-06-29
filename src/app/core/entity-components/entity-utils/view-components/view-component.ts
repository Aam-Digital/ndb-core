import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../entity-list/EntityListConfig";
import { Entity } from "../../../entity/entity";

export abstract class ViewComponent implements OnInitDynamicComponent {
  entity: Entity;
  property: string;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.entity = config.entity;
    this.property = config.id;
  }
}
