import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { SchoolsService } from "../schools.service";
import { Child } from "../../children/model/child";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Router } from "@angular/router";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { Entity } from "../../../core/entity/model/entity";

/**
 * This component creates a table containing all children currently attending this school.
 */
@Component({
  selector: "app-children-overview",
  templateUrl: "children-overview.component.html",
  styleUrls: ["./children-overview.component.scss"],
})
export class ChildrenOverviewComponent implements OnInitDynamicComponent {
  readonly addButtonLabel = ChildSchoolRelation.schema.get("childId").label;

  columns: FormFieldConfig[] = [
    { id: "childId" },
    { id: "schoolClass" },
    { id: "start" },
    { id: "end" },
    { id: "result" },
  ];

  entity: Entity;
  records: ChildSchoolRelation[] = [];

  constructor(private schoolsService: SchoolsService, private router: Router) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }
    this.entity = config.entity;
    this.records = await this.schoolsService.getRelationsForSchool(
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
