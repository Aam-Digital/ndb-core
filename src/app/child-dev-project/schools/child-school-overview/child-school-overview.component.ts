import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import moment from "moment";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { Child } from "../../children/model/child";
import { School } from "../model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { ChildrenService } from "../../children/children.service";
import { Entity } from "../../../core/entity/model/entity";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";

@DynamicComponent("ChildSchoolOverview")
@DynamicComponent("PreviousSchools")
@DynamicComponent("ChildrenOverview")
@Component({
  selector: "app-child-school-overview",
  templateUrl: "./child-school-overview.component.html",
  styleUrls: ["./child-school-overview.component.scss"],
  imports: [
    FontAwesomeModule,
    EntitySubrecordModule,
    MatSlideToggleModule,
    FormsModule,
    MatTooltipModule,
    NgIf,
  ],
  standalone: true,
})
export class ChildSchoolOverviewComponent
  implements OnChanges, OnInitDynamicComponent
{
  @Input() entity: Entity;
  mode: "child" | "school";

  @Input() columns: FormFieldConfig[] = [
    { id: "childId" }, // schoolId/childId replaced dynamically during init
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "schoolClass" },
    { id: "result" },
    isActiveIndicator,
  ];

  @Input() single = true;
  @Input() showInactive = false;
  @Input() clickMode: "popup" | "navigate" = "popup";

  isLoading = false;
  private allRecords: ChildSchoolRelation[] = [];
  displayedRecords: ChildSchoolRelation[] = [];
  backgroundColorFn = (r: ChildSchoolRelation) => r.getColor();
  hasCurrentlyActiveEntry: boolean;

  constructor(private childrenService: ChildrenService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entity")) {
      this.mode = this.inferMode(this.entity);
      await this.loadData();
    }
  }

  async onInitFromDynamicConfig(panelConfig: PanelConfig) {
    this.entity = panelConfig.entity;
    this.mode = this.inferMode(this.entity);

    this.single = panelConfig.config?.single ?? this.single;
    this.clickMode = panelConfig.config?.clickMode ?? this.clickMode;
    this.showInactive =
      panelConfig.config?.showInactive ?? this.mode === "child";
    if (panelConfig.config?.columns) {
      this.columns = [...panelConfig.config.columns, isActiveIndicator];
    }

    await this.loadData();
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
    this.allRecords = await this.childrenService.queryRelationsOf(
      this.mode,
      this.entity.getId(false)
    );

    this.prepareDisplayedData();
    this.isLoading = false;
  }

  prepareDisplayedData() {
    // display the related entity that is *not* the current main entity
    const idColumn = this.columns.find(
      (c) => c.id === "childId" || c.id === "schoolId"
    );
    if (idColumn) {
      idColumn.id = this.mode === "child" ? "schoolId" : "childId";
    }

    this.hasCurrentlyActiveEntry = this.allRecords.some(
      (record) => record.isActive
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

      if (mode === "child") {
        newRelation.childId = entityId;
        // start is one after the end date of the last relation or today if no other relation exists
        newRelation.start =
          this.allRecords.length && this.allRecords[0].end
            ? moment(this.allRecords[0].end).add(1, "day").toDate()
            : new Date();
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
