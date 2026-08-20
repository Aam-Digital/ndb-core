import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

/** highlight color for the entry that covers the current date */
export const CURRENTLY_ACTIVE_COLOR = "#90ee9040";

/**
 * Display a list of entity subrecords (entities related to the current entity details view)
 * which cover a time period.
 *
 * This component is similar to RelatedEntities but provides some additional UI to help users
 * create a new entry if no currently active entry exists.
 * Past entries stay visible like a history, the entry covering today is highlighted.
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
export class RelatedTimePeriodEntitiesComponent<
  E extends TimePeriod,
> extends RelatedEntitiesComponent<E> {
  // also see super class for Inputs

  single = input(true);

  backgroundColorFn = (r: E) =>
    r.isActiveAt(new Date()) ? CURRENTLY_ACTIVE_COLOR : "";

  readonly hasCurrentlyActiveEntry = computed(
    () =>
      this.dataSource
        .allRecords()
        ?.some((record) => record.isActiveAt(new Date())) ?? false,
  );

  override createNewRecordFactory() {
    return () => {
      const newRelation = super.createNewRecordFactory()();
      const currentData = this.dataSource.allRecords();

      newRelation.start =
        currentData?.length && currentData[0].end
          ? moment(currentData[0].end).add(1, "day").toDate()
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
        currentlyActiveIndicator,
      ];
    }
    return [
      ...value.map((column) => toFormFieldConfig(column)),
      currentlyActiveIndicator,
    ];
  }
}

export const currentlyActiveIndicator: FormFieldConfig = {
  id: "currentlyActive",
  label: $localize`:Label for the currently active status|e.g. Currently active:Currently`,
  viewComponent: "ReadonlyFunction",
  hideFromTable: true,
  description: $localize`:Tooltip for the status of currently active or not:Only added to linked record if active. Change the start or end date to modify this status.`,
  additional: (csr: ChildSchoolRelation) =>
    csr.isActiveAt(new Date())
      ? $localize`:Indication for the currently active status of an entry:active`
      : $localize`:Indication for the currently inactive status of an entry:not active`,
};
