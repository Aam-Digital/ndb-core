import { Component, Input, OnInit } from "@angular/core";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import moment from "moment";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { PillComponent } from "../../common-components/pill/pill.component";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { RelatedEntitiesComponent } from "../related-entities/related-entities.component";
import { TimePeriod } from "./time-period";

/**
 * Display a list of entity subrecords (entities related to the current entity details view)
 * which can be active or past/inactive.
 *
 * This component is similar to RelatedEntities but provides some additional UI to help users
 * create a new entry if no currently active entry exists and
 * show/hide inactive entries from the list.
 */
@DynamicComponent("RelatedTimePeriodEntities")
@Component({
  selector: "app-related-time-period-entities",
  templateUrl: "./related-time-period-entities.component.html",
  styleUrls: ["./related-time-period-entities.component.scss"],
  imports: [
    FontAwesomeModule,
    EntitiesTableComponent,
    MatSlideToggleModule,
    FormsModule,
    MatTooltipModule,
    NgIf,
    PillComponent,
  ],
  standalone: true,
})
export class RelatedTimePeriodEntitiesComponent<E extends TimePeriod>
  extends RelatedEntitiesComponent<E>
  implements OnInit
{
  // also see super class for Inputs

  @Input() single = true;
  @Input() showInactive = false;
  @Input() clickMode: "popup" | "navigate" = "popup";

  @Input() set columns(value: FormFieldConfig[]) {
    this._columns = [...value, isActiveIndicator];
  }
  get columns(): FormFieldConfig[] {
    return this._columns;
  }

  _columns: FormFieldConfig[] = [
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    isActiveIndicator,
  ];

  backgroundColorFn = (r: E) => r.getColor();
  hasCurrentlyActiveEntry: boolean;

  async ngOnInit() {
    await super.ngOnInit();
    this.onIsActiveFilterChange();
  }

  onIsActiveFilterChange() {
    this.hasCurrentlyActiveEntry = this.data.some((record) => record.isActive);

    if (this.showInactive) {
      this.backgroundColorFn = (r: E) => r.getColor();
    } else {
      this.backgroundColorFn = undefined; // Do not highlight active ones when only active are shown
    }
  }

  generateNewRecordFactory() {
    return () => {
      const newRelation = super.createNewRecordFactory()();

      newRelation.start =
        this.data?.length && this.data[0].end
          ? moment(this.data[0].end).add(1, "day").toDate()
          : moment().startOf("day").toDate();

      return newRelation;
    };
  }
}

export const isActiveIndicator: FormFieldConfig = {
  id: "isActive",
  label: $localize`:Label for the currently active status|e.g. Currently active:Currently`,
  viewComponent: "ReadonlyFunction",
  hideFromTable: true,
  description: $localize`:Tooltip for the status of currently active or not:Only added to linked record if active. Change the start or end date to modify this status.`,
  additional: (csr: ChildSchoolRelation) =>
    csr.isActive
      ? $localize`:Indication for the currently active status of an entry:active`
      : $localize`:Indication for the currently inactive status of an entry:not active`,
};
