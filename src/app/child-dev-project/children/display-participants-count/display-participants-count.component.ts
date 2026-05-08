import {
  Component,
  effect,
  signal,
  WritableSignal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ChildrenService } from "../children.service";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import { Logging } from "../../../core/logging/logging.service";

@DynamicComponent("DisplayParticipantsCount")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-participants-count",
  templateUrl: "./display-participants-count.component.html",
})
export class DisplayParticipantsCountComponent extends ViewDirective<any> {
  private _childrenService = inject(ChildrenService);

  participantRelationsCount: WritableSignal<number> = signal(null);

  constructor() {
    super();
    effect(() => {
      const entity = this.entity();
      if (!entity) return;
      this._childrenService
        .queryActiveRelationsOf(entity.getId())
        .then((relations: ChildSchoolRelation[]) => {
          this.participantRelationsCount.set(relations.length);
        })
        .catch((reason) => {
          Logging.error(
            "Could not calculate participantRelationsCount, error response from ChildrenService." +
              reason,
          );
        });
    });
  }
}
