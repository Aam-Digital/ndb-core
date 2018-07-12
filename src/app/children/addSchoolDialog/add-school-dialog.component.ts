import {Component, Inject, OnInit} from '@angular/core';
import {EntityMapperService} from "../../entity/entity-mapper.service";
import {School} from "../../schools/schoolsShared/school";
import {ChildSchoolRelation} from "../childSchoolRelation";

import uniqid from 'uniqid';
import {MAT_DIALOG_DATA, MatDialogRef, MatDialog} from "@angular/material";
import {Child} from "../child";

@Component({
  selector: 'app-add-school-dialog',
  templateUrl: './add-school-dialog.component.html',
  styleUrls: ['./add-school-dialog.component.scss']
})
export class AddSchoolDialogComponent {

  public schools: School[];
  public childSchoolRelation: ChildSchoolRelation = new ChildSchoolRelation(uniqid());

  constructor(private entityMapperService: EntityMapperService,
              public dialogRef: MatDialogRef<AddSchoolDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: Child
  ) {
    this.entityMapperService.loadType<School>(School)
      .then((schools: School[]) => this.schools = schools)
  }
}
