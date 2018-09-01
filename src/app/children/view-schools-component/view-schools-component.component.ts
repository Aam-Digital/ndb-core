import {Component, Input, OnInit} from '@angular/core';
import {ChildSchoolRelation} from "../childSchoolRelation";
import {School} from "../../schools/school";
import {EditSchoolDialogComponent} from "./edit-school-dialog/edit-school-dialog.component";
import {EntityMapperService} from "../../entity/entity-mapper.service";
import {MatDialog} from "@angular/material";
import {Child} from "../child";

@Component({
  selector: 'app-view-schools-component',
  templateUrl: './view-schools-component.component.html',
  styleUrls: ['./view-schools-component.component.scss']
})
export class ViewSchoolsComponentComponent implements OnInit {

  @Input() public child: Child = new Child('');

  viewableSchools: {
    school: School,
    childSchoolRelation: ChildSchoolRelation;
  }[] = [];

  childSchoolRelations: ChildSchoolRelation[] = [];

  constructor(private entityMapperService: EntityMapperService,
              private dialog: MatDialog) {
    this.loadSchoolEntries();
  }

  ngOnInit() {
  }

  public loadSchoolEntries() {
    this.viewableSchools = [];
    this.childSchoolRelations = [];
    this.entityMapperService.loadType<ChildSchoolRelation>(ChildSchoolRelation)
      .then((relations: ChildSchoolRelation[]) => {
        for (let r of relations) {
          if (r.childId == this.child.getId()) {
            this.childSchoolRelations.push(r);
            this.entityMapperService.load<School>(School, r.schoolId)
              .then((school: School) => {
                this.viewableSchools.push({
                  school: school,
                  childSchoolRelation: r,
                });
              }).catch(err => console.log("[LOAD_ENTRIES] Error", err))
          }
        }
      })
  }

  schoolClicked(viewableSchool) {
    let dialog = this.dialog.open(EditSchoolDialogComponent, {
      data: {
        childSchoolRelation: viewableSchool.childSchoolRelation,
        child: this.child,
      }});
    dialog.afterClosed().subscribe(res => {
      if (res) {
        viewableSchool.childSchoolRelation = res.childSchoolRelation;
        viewableSchool.school = res.school;
      }
    })
  }

  addSchoolClick() {
    let dialog = this.dialog.open(EditSchoolDialogComponent, {data: {child: this.child}});
    dialog.afterClosed().subscribe(res => {
      if (res) {
        this.viewableSchools.push({
          school: res.school,
          childSchoolRelation: res.childSchoolRelation,
        })
      }
    })
  }
}
