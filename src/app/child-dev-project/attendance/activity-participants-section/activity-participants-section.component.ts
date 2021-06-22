import { Component, Input } from "@angular/core";
import { RecurringActivity } from "../model/recurring-activity";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Child } from "../../children/model/child";
import { EntityConstructor } from "../../../core/entity/entity";
import { School } from "../../schools/model/school";
import { User } from "../../../core/user/user";

@Component({
  selector: "app-activity-participants-section",
  templateUrl: "./activity-participants-section.component.html",
  styleUrls: ["./activity-participants-section.component.scss"],
})
export class ActivityParticipantsSectionComponent
  implements OnInitDynamicComponent {
  get editing(): boolean {
    return this.editing_;
  }
  set editing(editing: boolean) {
    this.editing_ = editing;
    this.participants = [...this.entity.participants];
    this.participatingGroups = [...this.entity.linkedGroups];
    this.assignedUsers = [...this.entity.assignedTo];
  }
  @Input() entity: RecurringActivity;

  participants: string[] = [];
  participatingGroups: string[] = [];
  assignedUsers: string[] = [];

  readonly Child: EntityConstructor<Child> = Child;
  readonly School: EntityConstructor<School> = School;
  readonly User: EntityConstructor<User> = User;

  private editing_: boolean = false;

  constructor(private entityMapper: EntityMapperService) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity as RecurringActivity;
    this.participants = this.entity.participants;
    this.participatingGroups = this.entity.linkedGroups;
    this.assignedUsers = this.entity.assignedTo;
  }

  async save() {
    this.entity.participants = this.participants;
    this.entity.linkedGroups = this.participatingGroups;
    this.entity.assignedTo = this.assignedUsers;
    await this.entityMapper.save<RecurringActivity>(this.entity);
  }
}
