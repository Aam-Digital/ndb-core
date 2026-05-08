import {
  Component,
  computed,
  inject,
  resource,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ChildrenService } from "../children.service";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayParticipantsCount")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-participants-count",
  templateUrl: "./display-participants-count.component.html",
})
export class DisplayParticipantsCountComponent extends ViewDirective<any> {
  private _childrenService = inject(ChildrenService);

  private relationsResource = resource({
    params: () => this.entity()?.getId(),
    loader: ({ params: entityId }) =>
      this._childrenService.queryActiveRelationsOf(entityId),
  });

  participantRelationsCount = computed(() => {
    if (this.relationsResource.error()) return null;
    return this.relationsResource.value()?.length ?? null;
  });
}
