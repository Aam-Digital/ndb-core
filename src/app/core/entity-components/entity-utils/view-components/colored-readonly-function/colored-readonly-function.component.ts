import { Component } from '@angular/core';
import { ViewComponent } from '../view-component';
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { Entity } from "../../../../entity/model/entity";

@Component({
  selector: 'app-colored-readonly-function',
  templateUrl: './colored-readonly-function.component.html',
  styleUrls: ['./colored-readonly-function.component.scss']
})
export class ColoredReadonlyFunctionComponent extends ViewComponent {
  displayFunction: (entity: Entity) => any;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.displayFunction = config.config;
  }
}
