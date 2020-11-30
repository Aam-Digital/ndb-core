import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import { ChildSchoolRelation } from "../../model/childSchoolRelation";
import { ChildrenService } from "../../children.service";

@Component({
  selector: "app-list-relation",
  templateUrl: "./list-relation.component.html",
  styleUrls: ["./list-relation.component.scss"],
})
export class ListRelationComponent implements OnChanges {
  @Input() id: string;
  @Input() child: Child;
  relation: ChildSchoolRelation;

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.childrenService
        .queryLatestRelation(this.child.getId())
        .then((rel) => {
          this.relation = rel;

          // Set these values to allow sorting in the children list
          this.child["schoolClass"] = this.relation.schoolClass;
          // This will sort by the schoolID, same behavior as on the current master
          this.child["schoolId"] = this.relation.schoolId;
        });
    }
  }
}
