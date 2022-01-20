import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Child } from "../../children/model/child";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Router } from "@angular/router";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { Entity } from "../../../core/entity/model/entity";
import { ChildrenService } from "../../children/children.service";

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
 */
@Component({
  selector: "app-children-overview",
  templateUrl: "children-overview.component.html",
  styleUrls: ["./children-overview.component.scss"],
})
export class ChildrenOverviewComponent implements OnInitDynamicComponent {
  columns: FormFieldConfig[] = [
    { id: "childId" },
    { id: "schoolClass" },
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "result" },
    isActiveIndicator,
  ];

  entity: Entity;
  records: ChildSchoolRelation[] = [];

  constructor(
    private childrenService: ChildrenService,
    private router: Router
  ) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }
    this.entity = config.entity;
    this.records = await this.childrenService.queryRelationsOf(
      "school",
      this.entity.getId()
    );
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
