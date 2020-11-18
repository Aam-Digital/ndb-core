import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import { ChildrenService } from "../../children.service";
import { ChildSchoolRelation } from "../../model/childSchoolRelation";

@Component({
  selector: "app-list-school",
  template:
    '<app-school-block [entityId]="relation?.schoolId"></app-school-block>',
})
export class ListSchoolComponent implements OnChanges {
  @Input() child: Child;
  relation: ChildSchoolRelation;

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.childrenService
        .queryLatestRelation(this.child.getId())
        .then((rel) => (this.relation = rel));
    }
  }
}
