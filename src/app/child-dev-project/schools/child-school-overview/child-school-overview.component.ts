import { Component, Input, OnInit } from "@angular/core";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import moment from "moment";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { Child } from "../../children/model/child";
import { School } from "../model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { ChildrenService } from "../../children/children.service";
import { Entity } from "../../../core/entity/model/entity";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { PillComponent } from "../../../core/common-components/pill/pill.component";

@DynamicComponent("ChildSchoolOverview")
@DynamicComponent("PreviousSchools")
@DynamicComponent("ChildrenOverview")
@Component({
  selector: "app-child-school-overview",
  templateUrl: "./child-school-overview.component.html",
  styleUrls: ["./child-school-overview.component.scss"],
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
export class ChildSchoolOverviewComponent implements OnInit {
  @Input() entity: Entity;
  @Input() single = true;
  @Input() showInactive = false;
  @Input() clickMode: "popup" | "navigate" = "popup";
  // TODO: add @Input to configure what EntityType should be displayed (like RelatedEntitiesComponent)

  @Input() set columns(value: FormFieldConfig[]) {
    this._columns = [...value, isActiveIndicator];
  }

  _columns: FormFieldConfig[] = [
    { id: "childId" }, // schoolId/childId replaced dynamically during init
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "schoolClass" },
    { id: "result" },
    isActiveIndicator,
  ];

  mode: "child" | "school" = "child";
  isLoading = false;
  private allRecords: ChildSchoolRelation[] = [];
  displayedRecords: ChildSchoolRelation[] = [];
  backgroundColorFn = (r: ChildSchoolRelation) => r.getColor();
  hasCurrentlyActiveEntry: boolean;

  constructor(private childrenService: ChildrenService) {}

  ngOnInit() {
    // TODO: instead of having a "mode", allow configuration which property is used (like RelatedEntitiesComponent)
    this.mode = this.inferMode(this.entity);
    // display the related entity that is *not* the current main entity
    const idColumn = this._columns.find(
      (c) => c.id === "childId" || c.id === "schoolId",
    );
    if (idColumn) {
      idColumn.id = this.mode === "child" ? "schoolId" : "childId";
    }
    return this.loadData();
  }

  private inferMode(entity: Entity): "child" | "school" {
    switch (entity?.getConstructor()?.ENTITY_TYPE) {
      case Child.ENTITY_TYPE:
        return "child";
      case School.ENTITY_TYPE:
        return "school";
    }
  }

  async loadData() {
    if (!this.mode) {
      return;
    }

    this.isLoading = true;
    // TODO: load records through EntityMapper directly (without index?)
    // TODO: make this handle loading if linked property is array of multiple entity refs
    this.allRecords = await this.childrenService.queryRelationsOf(
      this.mode,
      this.entity.getId(false),
    );

    this.prepareDisplayedData();
    this.isLoading = false;
  }

  prepareDisplayedData() {
    this.hasCurrentlyActiveEntry = this.allRecords.some(
      (record) => record.isActive,
    );

    if (this.showInactive) {
      this.backgroundColorFn = (r: ChildSchoolRelation) => r.getColor();
      this.displayedRecords = this.allRecords;
    } else {
      this.backgroundColorFn = undefined; // Do not highlight active ones when only active are shown
      this.displayedRecords = this.allRecords.filter((r) => r.isActive);
    }
  }

  generateNewRecordFactory() {
    const entityId = this.entity.getId();
    const mode = this.mode;

    return () => {
      const newRelation = new ChildSchoolRelation();

      // TODO: generalize pre-selected props of new record
      //  -> use Input of linked property to set the reference
      //  -> allow config to on/off setting default date to "today" / "last end date" / "none"
      if (mode === "child") {
        newRelation.childId = entityId;
        // start is one after the end date of the last relation or today if no other relation exists
        newRelation.start =
          this.allRecords.length && this.allRecords[0].end
            ? moment(this.allRecords[0].end).add(1, "day").toDate()
            : moment().startOf("day").toDate();
      } else if (mode === "school") {
        newRelation.schoolId = entityId;
      }

      return newRelation;
    };
  }
}

export const isActiveIndicator = {
  id: "isActive",
  label: $localize`:Label for the currently active status|e.g. Currently active:Currently`,
  view: "ReadonlyFunction",
  hideFromTable: true,
  tooltip: $localize`:Tooltip for the status of currently active or not:Only added to school/group if active.Change the start or end date to modify this status.`,
  additional: (csr: ChildSchoolRelation) =>
    csr.isActive
      ? $localize`:Indication for the currently active status of an entry:active`
      : $localize`:Indication for the currently inactive status of an entry:not active`,
};
