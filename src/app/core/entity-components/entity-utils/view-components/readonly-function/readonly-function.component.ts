import { Component, Input } from "@angular/core";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewDirective } from "../view.directive";
import { Entity } from "../../../../entity/model/entity";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("ReadonlyFunction")
@Component({
  selector: "app-readonly-function",
  template: `{{ entity | entityFunction: displayFunction }}`,
})
export class ReadonlyFunctionComponent extends ViewDirective<any> {
  @Input() displayFunction: (entity: Entity) => any;

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.displayFunction = config.config;
  }
}
