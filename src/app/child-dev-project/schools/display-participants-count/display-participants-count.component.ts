import { Component, OnChanges, signal, WritableSignal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ChildrenService } from "../../children/children.service";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { LoggingService } from "../../../core/logging/logging.service";

@DynamicComponent("DisplayParticipantsCount")
@Component({
  selector: "app-display-participants-count",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./display-participants-count.component.html",
})
export class DisplayParticipantsCountComponent
  extends ViewDirective<any>
  implements OnChanges
{
  participantRelationsCount: WritableSignal<number> = signal(null);

  constructor(
    private _childrenService: ChildrenService,
    private _loggingService: LoggingService,
  ) {
    super();
  }

  override async ngOnChanges(): Promise<void> {
    super.ngOnChanges();

    return this._childrenService
      .queryActiveRelationsOf("school", this.entity.getId())
      .then((relations: ChildSchoolRelation[]) => {
        this.participantRelationsCount.set(relations.length);
      })
      .catch((reason) => {
        this._loggingService.error(
          "Could not calculate participantRelationsCount, error response from ChildrenService." +
            reason,
        );
      });
  }
}
