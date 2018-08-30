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
  dates: any = [];


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
                let temp: ViewableSchool = new ViewableSchool(school, r);
                this.viewableSchools.push(temp);
                this.dates.push({start: temp.start, end: temp.end});
              }).catch(err => console.log("[LOAD_ENTRIES] Error", err))
          }
        }
      })
  }

  switchEdit() {
    this.editing = !this.editing;
    console.log(this.viewableSchools);
  }

  save() {
    console.log(this.dates);

    for (let s of this.viewableSchools) {
      s.childSchoolRelation.start = s.start;
      console.log("end " + s.end + " start " + s.start);
      s.childSchoolRelation.end = s.end;
      console.log(JSON.stringify(s.childSchoolRelation));

      this.entityMapperService.save<ChildSchoolRelation>(s.childSchoolRelation)
        .then(res => {
          console.log("[SAVE]", res)
        })
        .catch(err => {
          console.log("[SAVE_ERROR]", err)
        });
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
  private _schoolName: string;
  private _childSchoolRelation: ChildSchoolRelation;
  private _start: Date;
  private _end: Date;

  get schoolName(): string {
    return this._schoolName;
  }

  set schoolName(value: string) {
    this._schoolName = value;
  }

  get childSchoolRelation(): ChildSchoolRelation {
    return this._childSchoolRelation;
  }

  set childSchoolRelation(value: ChildSchoolRelation) {
    this._childSchoolRelation = value;
  }

  get start(): Date {
    return this._start;
  }

  set start(value: Date) {
    this._start = value;
  }

  get end(): Date {
    return this._end;
  }

  set end(value: Date) {
    this._end = value;
  }

  constructor(school: School, childSchoolRelation: ChildSchoolRelation) {
    this._schoolName = school.name;
    this._childSchoolRelation = childSchoolRelation;
    if (childSchoolRelation.start != undefined) {
      this._start = childSchoolRelation.start;
    }
    // if (childSchoolRelation.end != undefined) {
      this._end = childSchoolRelation.end;
    // }
  }
}
