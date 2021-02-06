import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { SchoolsService } from "../schools.service";
import { Child } from "../../children/model/child";
import { MatTableDataSource } from "@angular/material/table";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";

/**
 * This component creates a table containing all children currently attending this school.
 */
@Component({
  selector: "app-children-overview",
  templateUrl: "./children-overview.component.html",
})
export class ChildrenOverviewComponent implements OnInitDynamicComponent {
  // This component can currently not use the EntitySubrecord, because EntitySubrecord does not allow to route to a
  // different location but only open a popup when a record is clicked.
  columns: ColumnDescription[] = [
    {
      name: "projectNumber",
      label: "PN",
      inputType: ColumnDescriptionInputType.TEXT,
    },
    {
      name: "name",
      label: "Name",
      inputType: ColumnDescriptionInputType.TEXT,
    },
    {
      name: "schoolClass",
      label: "Class",
      inputType: ColumnDescriptionInputType.TEXT,
    },
    {
      name: "age",
      label: "Age",
      inputType: ColumnDescriptionInputType.TEXT,
    },
  ];

  displayedColumns = ["projectNumber", "name", "schoolClass", "age"];

  studentsDataSource: MatTableDataSource<Child> = new MatTableDataSource<
    Child
  >();

  constructor(private schoolsService: SchoolsService) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.displayedColumns) {
      this.displayedColumns = config.config.displayedColumns;
    }

    this.schoolsService
      .getChildrenForSchool(config.entity.getId())
      .then((children) => (this.studentsDataSource.data = children));
  }
}
