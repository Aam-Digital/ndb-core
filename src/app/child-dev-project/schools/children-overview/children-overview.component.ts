import { Component, OnInit } from "@angular/core";
import { ColumnDescription } from "../../../core/entity-subrecord/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-subrecord/entity-subrecord/column-description-input-type.enum";
import { ChildDetailsComponent } from "../../children/child-details/child-details.component";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { SchoolsService } from "../schools.service";
import { Child } from "../../children/model/child";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  selector: "app-children-overview",
  templateUrl: "./children-overview.component.html",
})
export class ChildrenOverviewComponent implements OnInitDynamicComponent {
  // This component can currently not use the EntitySubrecord, because EntitySubrecord does not allow to route to a
  // different location but only open a popup when a record is clicked.
  columns: ColumnDescription[] = [
    new ColumnDescription(
      "projectNumber",
      "PN",
      ColumnDescriptionInputType.TEXT
    ),
    new ColumnDescription("name", "Name", ColumnDescriptionInputType.TEXT),
    new ColumnDescription(
      "schoolClass",
      "Class",
      ColumnDescriptionInputType.TEXT
    ),
    new ColumnDescription("age", "Age", ColumnDescriptionInputType.TEXT),
  ];

  displayedColumns = ["projectNumber", "name", "schoolClass", "age"];

  studentsDataSource: MatTableDataSource<Child> = new MatTableDataSource<
    Child
  >();

  constructor(private schoolsService: SchoolsService) {}

  onInitFromDynamicConfig(config: any) {
    this.schoolsService
      .getChildrenForSchool(config.child.getId())
      .then((children) => (this.studentsDataSource.data = children));
  }
}
