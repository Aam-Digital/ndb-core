import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  input,
} from "@angular/core";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import moment from "moment";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { PillComponent } from "../../common-components/pill/pill.component";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { RelatedEntitiesComponent } from "../related-entities/related-entities.component";
import { TimePeriod } from "./time-period";
import { CustomFormLinkButtonComponent } from "app/features/public-form/custom-form-link-button/custom-form-link-button.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-related-time-period-entities",
  templateUrl: "./related-time-period-entities.component.html",
  styleUrls: ["./related-time-period-entities.component.scss"],
  imports: [
    FontAwesomeModule,
    EntitiesTableComponent,
    MatSlideToggleModule,
    FormsModule,
    MatTooltipModule,
    PillComponent,
    CustomFormLinkButtonComponent,
  ],
})
export class RelatedTimePeriodEntitiesComponent<E extends TimePeriod>
  extends RelatedEntitiesComponent<E>
  implements OnInit
{
  // also see super class for Inputs

  single = input(true);

  backgroundColorFn = (r: E) => r.getColor();
  hasCurrentlyActiveEntry: boolean;

  override async ngOnInit() {
    if (this.showInactive() === undefined) {
      this.showInactive.set(false);
    }
    await super.ngOnInit();
    this.hasCurrentlyActiveEntry =
      this.data?.some((record) => record.isActive) ?? false;
  }

  override createNewRecordFactory() {
    return () => {
      const newRelation = super.createNewRecordFactory()();

      newRelation.start =
        this.data?.length && this.data[0].end
          ? moment(this.data[0].end).add(1, "day").toDate()
          : moment().startOf("day").toDate();

      return newRelation;
    };
  }

  protected override getColumns(
    value: ColumnConfig[] | undefined,
  ): FormFieldConfig[] {
    if (!Array.isArray(value) || value.length === 0) {
      return [
        { id: "start", visibleFrom: "md" },
        { id: "end", visibleFrom: "md" },
        isActiveIndicator,
      ];
    }
    return [
      ...value.map((column) => toFormFieldConfig(column)),
      isActiveIndicator,
    ];
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
