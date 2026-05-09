import { Component, computed, ChangeDetectionStrategy } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityBlockComponent } from "../entity-block/entity-block.component";
import { asArray } from "app/utils/asArray";

@DynamicComponent("DisplayEntity")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
  imports: [EntityBlockComponent],
})
export class DisplayEntityComponent extends ViewDirective<
  string[] | string,
  string
> {
  readonly aggregationThreshold = 5;
  readonly entityIds = computed(() =>
    this.value() ? asArray(this.value()) : [],
  );
}
