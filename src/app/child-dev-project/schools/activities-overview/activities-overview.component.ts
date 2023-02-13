import { Component } from "@angular/core";
import { RecurringActivity } from "app/child-dev-project/attendance/model/recurring-activity";
import { FormFieldConfig } from "app/core/entity-components/entity-form/entity-form/FormConfig";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { DynamicComponent } from "app/core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "app/core/view/dynamic-components/on-init-dynamic-component.interface";
import { delay } from "rxjs";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@DynamicComponent("ActivitiesOverview")
@Component({
  selector: "app-activities-overview",
  templateUrl: "./activities-overview.component.html",
  styleUrls: ["./activities-overview.component.scss"],
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class ActivitiesOverviewComponent implements OnInitDynamicComponent {
  titleColumn = {
    id: "title",
    edit: "EditTextWithAutocomplete",
    additional: {
      entityType: "RecurringActivity",
      relevantProperty: "linkedGroups",
      relevantValue: "",
    },
  };
  columns: FormFieldConfig[] = [
    this.titleColumn,
    { id: "type" },
    { id: "assignedTo" },
    { id: "linkedGroups" },
    { id: "excludedParticipants" },
  ];

  entity: Entity;
  records: RecurringActivity[] = [];

  constructor(private entityMapper: EntityMapperService) {}

  async onInitFromDynamicConfig(config: any) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }

    this.entity = config.entity;
    this.titleColumn.additional.relevantValue = this.entity.getId();
    await this.initLinkedActivities();

    this.entityMapper
      .receiveUpdates(RecurringActivity)
      // using short delay to make sure the EntitySubrecord's `receiveUpdates` code is executed before this
      .pipe(delay(0), untilDestroyed(this))
      .subscribe((updateEntity) => {
        if (updateEntity.type === "update") {
          this.initLinkedActivities();
        }
      });
  }

  private async initLinkedActivities() {
    this.records = await this.entityMapper
      .loadType(RecurringActivity)
      .then((activities) =>
        activities.filter((activity) =>
          activity.linkedGroups.includes(this.entity.getId())
        )
      );
  }

  generateNewRecordFactory(): () => RecurringActivity {
    return () => {
      const newRecurringActivity = new RecurringActivity();
      newRecurringActivity.linkedGroups.push(this.entity.getId());
      return newRecurringActivity;
    };
  }
}
