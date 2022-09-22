import { Component } from "@angular/core";
import { RecurringActivity } from "app/child-dev-project/attendance/model/recurring-activity";
import { FormFieldConfig } from "app/core/entity-components/entity-form/entity-form/FormConfig";
import { EntityListConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { DynamicComponent } from "app/core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "app/core/view/dynamic-components/on-init-dynamic-component.interface";
import { delay } from "rxjs";

@DynamicComponent("ActivitiesOverview")
@Component({
  selector: "app-activities-overview",
  templateUrl: "./activities-overview.component.html",
  styleUrls: ["./activities-overview.component.scss"],
})
export class ActivitiesOverviewComponent implements OnInitDynamicComponent {
  columns: FormFieldConfig[] = [
    { id: "title" },
    { id: "type" },
    { id: "assignedTo" },
    { id: "linkedGroups" },
  ];

  entity: Entity;
  records: RecurringActivity[] = [];
  listConfig: EntityListConfig;

  constructor(private entityMapper: EntityMapperService) {}

  async onInitFromDynamicConfig(config: any) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }

    this.entity = config.entity;
    this.records = (
      await this.entityMapper.loadType<RecurringActivity>(RecurringActivity)
    ).filter((activity) => activity.linkedGroups.includes(this.entity.getId()));

    this.entityMapper
      .receiveUpdates(RecurringActivity)
      // using short delay to make sure the EntitySubrecord's `receiveUpdates` code is executed before this
      .pipe(delay(0))
      .subscribe((updateEntity) => {
        if (updateEntity.type === "update") {
          this.records = this.records.filter((activity) =>
            activity.linkedGroups.includes(this.entity.getId())
          );
        }
      });
  }

  generateNewRecordFactory(): () => RecurringActivity {
    return () => {
      const newRecurringActivity = new RecurringActivity();
      newRecurringActivity.linkedGroups.push(this.entity.getId());
      return newRecurringActivity;
    };
  }
}
