import {Component, Inject, OnInit} from '@angular/core';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {ChildSchoolRelation} from '../../childSchoolRelation';
import * as uniqid from 'uniqid';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Child} from '../../child';
import {School} from '../../../schools/school';

@Component({
  selector: 'app-add-school-dialog',
  templateUrl: './edit-school-dialog.component.html',
  styleUrls: ['./edit-school-dialog.component.scss']
})
export class EditSchoolDialogComponent implements OnInit {

  creating = false;
  public schools: School[];
  public selectedSchool: School;
  public child: Child;
  public childSchoolRelation: ChildSchoolRelation = new ChildSchoolRelation(uniqid());

  constructor(private entityMapperService: EntityMapperService,
              public dialogRef: MatDialogRef<EditSchoolDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data,
  ) { }

  ngOnInit() {
    this.child = this.data.child;

    if (this.data.childSchoolRelation) {
      this.entityMapperService.load<ChildSchoolRelation>(ChildSchoolRelation, this.data.childSchoolRelation.getId())
        .then((res: ChildSchoolRelation) => this.childSchoolRelation = res); // fetch a new one to not mutate the displayed object
    } else {
      this.creating = true;
      this.childSchoolRelation.childId = this.child.getId();
    }
    this.entityMapperService.loadType<School>(School)
      .then((schools: School[]) => {
        this.schools = schools;
        this.selectedSchool = this.schools.find(school => school.getId() === this.childSchoolRelation.schoolId);
      });
  }

  public editSchoolClick() {
    this.childSchoolRelation.schoolId = this.selectedSchool.getId();
    this.entityMapperService.save<ChildSchoolRelation>(this.childSchoolRelation)
      .then(() => this.closeAfterEditing(this.creating ? 'CREATE' : 'EDIT'));
  }

  public removeSchoolClick() {
    this.entityMapperService.remove<ChildSchoolRelation>(this.childSchoolRelation)
      .then(() => this.closeAfterEditing('DELETE'));
  }

  closeAfterEditing(editType: string) {
    this.dialogRef.close({
      childSchoolRelation: this.childSchoolRelation,
      school: this.selectedSchool,
      type: editType,
    });
  }
}

