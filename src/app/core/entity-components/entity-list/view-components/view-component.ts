import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnCellConfig } from "../EntityListConfig";
import { Entity } from "../../../entity/entity";

export abstract class ViewComponent implements OnInitDynamicComponent{
  entity: Entity;
  property: string;
  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.entity = config.entity;
    this.property = config.id;
  }

}
