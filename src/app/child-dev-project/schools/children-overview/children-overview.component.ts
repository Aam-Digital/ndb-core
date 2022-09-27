import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Child } from "../../children/model/child";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Router } from "@angular/router";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { Entity } from "../../../core/entity/model/entity";
import { ChildrenService } from "../../children/children.service";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

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

/**
 * This component creates a table containing all children currently attending this school.
 *
 * TODO merge with {@link PreviousSchoolsComponent}
 */
@DynamicComponent("ChildrenOverview")
@Component({
  selector: "app-children-overview",
  templateUrl: "children-overview.component.html",
  styleUrls: ["./children-overview.component.scss"],
})
export class ChildrenOverviewComponent implements OnInitDynamicComponent {
  columns: FormFieldConfig[] = [
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "childId" },
    { id: "schoolClass" },
    { id: "result" },
    isActiveIndicator,
  ];

  entity: Entity;

  private allRecords: ChildSchoolRelation[] = [];
  displayedRecords: ChildSchoolRelation[] = [];
  showInactive = false;
  backgroundColorFn = (r: ChildSchoolRelation) => r.getColor();

  constructor(
    private childrenService: ChildrenService,
    private router: Router
  ) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    if (config.config?.columns) {
      this.columns = config.config.columns.concat(isActiveIndicator);
    }
    this.entity = config.entity;
    this.allRecords = await this.childrenService.queryRelationsOf(
      "school",
      this.entity.getId()
    );
    this.showInactive = !!config.config?.showInactive;
    this.prepareDisplayedData();
  }

  prepareDisplayedData() {
    if (this.showInactive) {
      this.displayedRecords = this.allRecords;
      this.backgroundColorFn = (r: ChildSchoolRelation) => r.getColor();
    } else {
      this.displayedRecords = this.allRecords.filter((r) => r.isActive);
      // Do not highlight active ones when only active are shown
      this.backgroundColorFn = undefined;
    }
  }

  routeToChild(child: Child) {
    this.router.navigate([`/${child.getType().toLowerCase()}`, child.getId()]);
  }

  generateNewRecordFactory(): () => ChildSchoolRelation {
    return () => {
      const newRelation = new ChildSchoolRelation();
      newRelation.schoolId = this.entity.getId();
      return newRelation;
    };
  }
}
