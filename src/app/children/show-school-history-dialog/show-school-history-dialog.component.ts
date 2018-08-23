import {Component, Inject} from '@angular/core';
import {EntityMapperService} from "../../entity/entity-mapper.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {AddSchoolDialogComponent} from "../add-school-dialog/add-school-dialog.component";
import {ChildSchoolRelation} from "../childSchoolRelation";
import { School } from "../../schools/school";
import {Child} from "../child";

@Component({
  selector: 'app-show-school-history-dialog',
  templateUrl: './show-school-history-dialog.component.html',
  styleUrls: ['./show-school-history-dialog.component.scss']
})
export class ShowSchoolHistoryDialogComponent {
  childId: string;
  childSchoolRelations: ChildSchoolRelation[] = [];
  viewableSchools: ViewableSchool[] = [];
  editing: boolean = false;


  constructor(private entityMapperService: EntityMapperService,
              public dialogRef: MatDialogRef<AddSchoolDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.childId = this.data.childId;
    this.loadEntries();
  }

  private loadEntries() {
    this.viewableSchools = [];
    this.childSchoolRelations = [];
    this.entityMapperService.loadType<ChildSchoolRelation>(ChildSchoolRelation)
      .then((relations: ChildSchoolRelation[]) => {
        for (let r of relations) {
          if (r.childId == this.childId) {
            this.childSchoolRelations.push(r);
            this.entityMapperService.load<School>(School, r.schoolId)
              .then((school: School) => {
                this.viewableSchools.push(new ViewableSchool(school, r));
              }).catch(err => console.log("[LOAD_ENTRIES] Error", err))
          }
        }
      })
  }

  switchEdit() {
    this.editing = !this.editing;
  }

  save() {
    for (let s of this.viewableSchools) {
      s.childSchoolRelation.start = s.start;
      console.log("end " + s.end + " start " + s.start);
      s.childSchoolRelation.end = s.end;
      console.log(JSON.stringify(s.childSchoolRelation));

      this.entityMapperService.save<ChildSchoolRelation>(s.childSchoolRelation);
    }
  }

  cancel() {
    this.loadEntries();
  }


  private loadVisitedSchools() {
    this.entityMapperService.loadType<ChildSchoolRelation>(ChildSchoolRelation)
      .then((relations: ChildSchoolRelation[]) => {
        for (let r of relations) {
          if (r.childId == this.childId) {
            this.childSchoolRelations.push(r);
          }
        }
      })
  }
}

class ViewableSchool {
  schoolName: string;
  childSchoolRelation: ChildSchoolRelation;
  start: Date = new Date();
  end: Date = new Date();

  constructor(school: School, childSchoolRelation: ChildSchoolRelation) {
    this.schoolName = school.name;
    this.childSchoolRelation = childSchoolRelation;
    if (childSchoolRelation.start != undefined) {
      this.start = childSchoolRelation.start;
    }
    if (childSchoolRelation.end != undefined) {
      this.end = childSchoolRelation.end;
    }
  }
}
