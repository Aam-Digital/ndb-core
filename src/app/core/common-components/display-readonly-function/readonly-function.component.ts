import { Component } from "@angular/core";
import { ViewDirective } from "../../entity/default-datatype/view.directive";
import { Entity } from "../../entity/model/entity";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityFunctionPipe } from "./entity-function.pipe";

@DynamicComponent("ReadonlyFunction")
@Component({
  selector: "app-readonly-function",
  template: `{{ entity | entityFunction: config }}`,
  standalone: true,
  imports: [EntityFunctionPipe],
})
export class ReadonlyFunctionComponent extends ViewDirective<
  any,
  (entity: Entity) => any
> {}
