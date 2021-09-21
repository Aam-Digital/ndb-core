import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { SchoolsService } from "../schools.service";
import { Child } from "../../children/model/child";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
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
    { id: "result" },
  ];

  private popupColumns: (string | FormFieldConfig)[] = [
    "childId",
    "start",
    "end",
  ];

  children: Child[] = [];
  entity: Entity;
  records: ChildSchoolRelation[] = [];

  constructor(
    private schoolsService: SchoolsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  async onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }
    if (config?.config?.popupColumns?.length > 0) {
      this.popupColumns = config.config.popupColumns;
    }
    this.entity = config.entity;
    this.children = await this.schoolsService.getChildrenForSchool(
      this.entity.getId()
    );
    this.records = await this.schoolsService.getRelationsForSchool(
      this.entity.getId()
    );
  }

  routeToChild(child: Child) {
    this.router.navigate([`/${child.getType().toLowerCase()}`, child.getId()]);
  }

  addChildClick() {
    const dialogRef = this.dialog.open(EntityFormComponent, {
      width: "80%",
      maxHeight: "90vh",
    });

    dialogRef.componentInstance.columns = this.popupColumns.map((col) => [col]);
    const newRelation = new ChildSchoolRelation();
    newRelation.schoolId = this.entity.getId();
    dialogRef.componentInstance.entity = newRelation;
    dialogRef.componentInstance.editing = true;
    dialogRef.componentInstance.onSave.subscribe(async () => {
      dialogRef.close();
      this.children = await this.schoolsService.getChildrenForSchool(
        this.entity.getId()
      );
    });
    dialogRef.componentInstance.onCancel.subscribe(() => dialogRef.close());
  }

  generateNewRecordFactory():() => ChildSchoolRelation{
    return () => {
      const newRelation = new ChildSchoolRelation();
      newRelation.schoolId = this.entity.getId();
      return newRelation
    }
  }
}
