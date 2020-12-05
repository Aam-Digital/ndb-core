import { Component, OnInit } from "@angular/core";
import { ColumnDescription } from "../../../core/entity-subrecord/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-subrecord/entity-subrecord/column-description-input-type.enum";
import { ChildDetailsComponent } from "../../children/child-details/child-details.component";

@Component({
  selector: "app-children-overview",
  template: ` <app-entity-subrecord
    [columns]="columns"
    [detailsComponent]=""
  ></app-entity-subrecord>`,
})
export class ChildrenOverviewComponent implements OnInit {
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

  childDetailsComponent = ChildDetailsComponent;

  constructor() {}

  ngOnInit(): void {}
}
