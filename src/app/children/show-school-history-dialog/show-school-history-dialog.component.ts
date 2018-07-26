import {Component, Inject} from '@angular/core';
import {EntityMapperService} from "../../entity/entity-mapper.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {AddSchoolDialogComponent} from "../add-school-dialog/add-school-dialog.component";
import {ChildSchoolRelation} from "../childSchoolRelation";
import { School } from "../../schools/school";

@Component({
  selector: 'app-show-school-history-dialog',
  templateUrl: './show-school-history-dialog.component.html',
  styleUrls: ['./show-school-history-dialog.component.scss']
})
export class ShowSchoolHistoryDialogComponent {
  childSchoolRelations: ChildSchoolRelation[] = [];
  viewableSchools: ViewableSchool[] = [];


  constructor(private entityMapperService: EntityMapperService,
              public dialogRef: MatDialogRef<AddSchoolDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.childSchoolRelations = this.data.visitedSchools;
    for (let r of this.childSchoolRelations) {
      this.entityMapperService.load<School>(School, r.schoolId)
        .then((school: School) => {
          console.log("school " + JSON.stringify(school));
          this.viewableSchools.push(new ViewableSchool(school, r));
        })
    }
  }
}

class ViewableSchool {
  schoolName: string;
  start: Date;
  end: Date;

  constructor(school: School, childSchoolRelation: ChildSchoolRelation) {
    this.schoolName = school.name;
    this.start = childSchoolRelation.start;
    this.end = childSchoolRelation.end;
  }
}
