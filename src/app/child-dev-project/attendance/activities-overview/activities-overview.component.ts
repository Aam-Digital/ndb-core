import { Component, OnInit } from "@angular/core";
import { RecurringActivity } from "../model/recurring-activity";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormLinkButtonComponent } from "app/features/public-form/custom-form-link-button/custom-form-link-button.component";
import { ENTITY_DEFAULT_VALUES } from "app/utils/entity-default-values";

/**
 * @deprecated configure a RelatedEntitiesComponent instead
 */
@DynamicComponent("ActivitiesOverview")
@Component({
  selector: "app-activities-overview",
  templateUrl:
    "../../../core/entity-details/related-entities/related-entities.component.html",
  imports: [
    EntitiesTableComponent,
    FontAwesomeModule,
    CustomFormLinkButtonComponent,
  ],
})
export class ActivitiesOverviewComponent
  extends RelatedEntitiesComponent<RecurringActivity>
  implements OnInit
{
  override entityCtr = RecurringActivity;

  titleColumn: FormFieldConfig = {
    id: "title",
    editComponent: "EditTextWithAutocomplete",
    additional: {
      entityType: "RecurringActivity",
      relevantProperty: "linkedGroups",
      relevantValue: "",
    },
  };
  override _columns: FormFieldConfig[] =
    ENTITY_DEFAULT_VALUES["ActivitiesOverview"].columns;

  override async ngOnInit() {
    this.titleColumn.additional.relevantValue = this.entity.getId();
    await super.ngOnInit();
  }
}
