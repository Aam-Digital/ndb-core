import { Component, Input, OnInit } from "@angular/core";
import { FormFieldConfig } from "../entity-form/entity-form/FormConfig";
import moment from "moment";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";
import { EntitySubrecordComponent } from "../entity-subrecord/entity-subrecord/entity-subrecord.component";
import { PillComponent } from "../../common-components/pill/pill.component";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { RelatedEntitiesComponent } from "../entity-details/related-entities/related-entities.component";
import { TimePeriodRelation } from "./time-period-relation";
import { DataFilter } from "../entity-subrecord/entity-subrecord/entity-subrecord-config";

/**
 * Display a list of entity subrecords (entities related to the current entity details view)
 * which can be active or past/inactive.
 *
 * This component is similar to RelatedEntities but provides some additional UI to help users
 * create a new entry if no currently active entry exists and
 * show/hide inactive entries from the list.
 *
 * TODO: this is a more generic copy of ChildSchoolOverview - remove that once schema-generated indices are available
 *  or should we just forget about that index for now? (longest running instance has total of 1000+ ChildSchoolRelation docs)
 */
@DynamicComponent("PreviousRelations")
@Component({
  selector: "app-previous-relations",
  templateUrl: "./previous-relations.component.html",
  styleUrls: ["./previous-relations.component.scss"],
  imports: [
    FontAwesomeModule,
    EntitySubrecordComponent,
    MatSlideToggleModule,
    FormsModule,
    MatTooltipModule,
    NgIf,
    PillComponent,
  ],
  standalone: true,
})
export class PreviousRelationsComponent<E extends TimePeriodRelation>
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
    await super.initData();

    this.filterActiveInactive();
  }

  filterActiveInactive() {
    this.hasCurrentlyActiveEntry = this.data.some((record) => record.isActive);

    const filters = this.filter ?? {};
    if (this.showInactive) {
      this.backgroundColorFn = (r: E) => r.getColor();
      // @ts-ignore type has issues with getters
      delete filters.isActive;
    } else {
      this.backgroundColorFn = undefined; // Do not highlight active ones when only active are shown
      filters["isActive"] = true;
    }
    // recreate to trigger change detection and update displayed data
    this.filter = { ...filters } as DataFilter<E>;
  }

  generateNewRecordFactory() {
    return () => {
      const newRelation = super.createNewRecordFactory()();

      newRelation.start =
        this.data.length && this.data[0].end
          ? moment(this.data[0].end).add(1, "day").toDate()
          : moment().startOf("day").toDate();

      return newRelation;
    };
  }
}

export const isActiveIndicator = {
  id: "isActive",
  label: $localize`:Label for the currently active status|e.g. Currently active:Currently`,
  view: "ReadonlyFunction",
  hideFromTable: true,
  tooltip: $localize`:Tooltip for the status of currently active or not:Only added to linked record if active. Change the start or end date to modify this status.`,
  additional: (csr: ChildSchoolRelation) =>
    csr.isActive
      ? $localize`:Indication for the currently active status of an entry:active`
      : $localize`:Indication for the currently inactive status of an entry:not active`,
};
