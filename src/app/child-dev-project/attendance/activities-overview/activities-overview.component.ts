import { Component, OnInit } from "@angular/core";
import { RecurringActivity } from "../model/recurring-activity";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { EntitySubrecordComponent } from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { ColumnConfig } from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FormFieldConfig } from "../../../core/common-components/entity-form/entity-form/FormConfig";

/**
 * @deprecated configure a RelatedEntitiesComponent instead
 */
@DynamicComponent("ActivitiesOverview")
@Component({
  selector: "app-activities-overview",
  templateUrl:
    "../../../core/entity-details/related-entities/related-entities.component.html",
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class ActivitiesOverviewComponent
  extends RelatedEntitiesComponent<RecurringActivity>
  implements OnInit
{
  entityType = RecurringActivity.ENTITY_TYPE;
  property = "linkedGroups";

  titleColumn: FormFieldConfig = {
    id: "title",
    editComponent: "EditTextWithAutocomplete",
    additional: {
      entityType: "RecurringActivity",
      relevantProperty: "linkedGroups",
      relevantValue: "",
    },
  };
  _columns: ColumnConfig[] = [
    this.titleColumn,
    "type",
    "assignedTo",
    "linkedGroups",
    "excludedParticipants",
  ];

  async ngOnInit() {
    this.titleColumn.additional.relevantValue = this.entity.getId();
    await super.ngOnInit();
  }
}
