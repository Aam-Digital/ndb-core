import { Component, Input } from "@angular/core";
import { RecurringActivity } from "../model/recurring-activity";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Child } from "../../children/model/child";
import { EntityConstructor } from "../../../core/entity/entity";
import { School } from "../../schools/model/school";

@Component({
  selector: "app-activity-participants-section",
  templateUrl: "./activity-participants-section.component.html",
  styleUrls: ["./activity-participants-section.component.scss"],
})
export class ActivityParticipantsSectionComponent
  implements OnInitDynamicComponent {
  @Input() entity: RecurringActivity;

  editing: boolean;
  participants: string[] = [];
  participatingGroups: string[] = [];

  readonly Child: EntityConstructor<Child> = Child;
  readonly School: EntityConstructor<School> = School;

  constructor(private entityMapper: EntityMapperService) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity as RecurringActivity;
    this.participants = this.entity.participants;
    this.participatingGroups = this.entity.linkedGroups;
  }

  switchEdit() {
    this.editing = !this.editing;
    this.participants = [...this.entity.participants];
    this.participatingGroups = [...this.entity.linkedGroups];
  }

  async save() {
    this.entity.participants = this.participants;
    this.entity.linkedGroups = this.participatingGroups;
    await this.entityMapper.save<RecurringActivity>(this.entity);
    this.editing = false;
  }
}
