import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import { ChildSchoolRelation } from "../../model/childSchoolRelation";
import { ChildrenService } from "../../children.service";

@Component({
  selector: "app-list-class",
  template: "{{relation?.schoolClass}}",
})
export class ListClassComponent implements OnChanges {
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
