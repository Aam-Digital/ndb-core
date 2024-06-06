import { Component, OnInit } from "@angular/core";
import { RecurringActivity } from "../model/recurring-activity";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";

/**
 * @deprecated configure a RelatedEntitiesComponent instead
 */
@DynamicComponent("ActivitiesOverview")
@Component({
  selector: "app-activities-overview",
  templateUrl:
    "../../../core/entity-details/related-entities/related-entities.component.html",
  imports: [EntitiesTableComponent],
  standalone: true,
})
export class ActivitiesOverviewComponent
  extends RelatedEntitiesComponent<RecurringActivity>
  implements OnInit
{
  entityCtr = RecurringActivity;

  // TODO: write config migration and remove this component
  override _columns: FormFieldConfig[] = [
    { id: "title" },
    { id: "type" },
    { id: "assignedTo" },
    { id: "linkedGroups" },
    { id: "excludedParticipants" },
  ];

  async ngOnInit() {
    await super.ngOnInit();
  }
}
