import { Component, OnChanges, signal, WritableSignal, inject } from "@angular/core";
import { ChildrenService } from "../children.service";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import { Logging } from "../../../core/logging/logging.service";

@DynamicComponent("DisplayParticipantsCount")
@Component({
  selector: "app-display-participants-count",
  templateUrl: "./display-participants-count.component.html",
})
export class DisplayParticipantsCountComponent
  extends ViewDirective<any>
  implements OnChanges
{
  private _childrenService = inject(ChildrenService);

  participantRelationsCount: WritableSignal<number> = signal(null);

  override async ngOnChanges(): Promise<void> {
    super.ngOnChanges();

    return this._childrenService
      .queryActiveRelationsOf(this.entity.getId())
      .then((relations: ChildSchoolRelation[]) => {
        this.participantRelationsCount.set(relations.length);
      })
      .catch((reason) => {
        Logging.error(
          "Could not calculate participantRelationsCount, error response from ChildrenService." +
            reason,
        );
      });
  }
}
