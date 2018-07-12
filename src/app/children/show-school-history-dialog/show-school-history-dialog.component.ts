import {Component, Inject} from '@angular/core';
import {EntityMapperService} from "../../entity/entity-mapper.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {AddSchoolDialogComponent} from "../add-school-dialog/add-school-dialog.component";
import {School} from "../../schools/schoolsShared/school";
import {ChildSchoolRelation} from "../childSchoolRelation";

@Component({
  selector: 'app-show-school-history-dialog',
  templateUrl: './show-school-history-dialog.component.html',
  styleUrls: ['./show-school-history-dialog.component.scss']
})
export class ShowSchoolHistoryDialogComponent {
  childSchoolRelations: ChildSchoolRelation[] = [];
  visitedSchools: School[] = [];


  constructor(private entityMapperService: EntityMapperService,
              public dialogRef: MatDialogRef<AddSchoolDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.childSchoolRelations = this.data.visitedSchools;
    for (let s of this.childSchoolRelations) {
      this.entityMapperService.load<School>(School, s.schoolId)
        .then((school: School) => this.visitedSchools.push(school))
    }
  }
}
