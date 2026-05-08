import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { EntityTypeLabelPipe } from "app/core/common-components/entity-type-label/entity-type-label.pipe";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { asArray } from "app/utils/asArray";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-entity-type",
  standalone: true,
  providers: [EntityTypeLabelPipe],
  template: `<span class="display-entity-type-label">{{
    entityLabel()
  }}</span>`,
  styleUrls: ["./display-entity-type.component.scss"],
})
export class DisplayEntityTypeComponent extends ViewDirective<
  string[] | string,
  string
> {
  private entityTypeLabelPipe = inject(EntityTypeLabelPipe);

  entityLabel = computed(() => {
    const entityIds = this.value() ? asArray(this.value()) : [];
    return entityIds
      .map((id) => this.entityTypeLabelPipe.transform(id) || id)
      .join(", ");
  });
}
