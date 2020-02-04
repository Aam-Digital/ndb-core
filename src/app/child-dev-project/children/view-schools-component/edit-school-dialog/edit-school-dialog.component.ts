import { Component, Inject, OnInit } from '@angular/core';
import { EntityMapperService } from '../../../../core/entity/entity-mapper.service';
import { ChildSchoolRelation } from '../../model/childSchoolRelation';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogService } from '../../../../core/ui-helper/confirmation-dialog/confirmation-dialog.service';
import { AbstractDetailsComponent } from '../../../../core/ui-helper/AbstractDetailsComponent';
import { School } from '../../../schools/model/school';
import { Child } from '../../model/child';

@Component({
  selector: 'app-add-school-dialog',
  templateUrl: './edit-school-dialog.component.html',
  styleUrls: ['./edit-school-dialog.component.scss'],
})
export class EditSchoolDialogComponent extends AbstractDetailsComponent<ChildSchoolRelation> implements OnInit {

  private selectedSchool: School;
  /**Cached array of all schools for selection only*/
  private schools: School[];
  /**Whether or not this is used to create a new note.
   * Defaults to true, will be set in ngOnInit()
   */
  private creating: boolean = true;
  private child: Child;

  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              dialogRef: MatDialogRef<EditSchoolDialogComponent>,
              confirmationDialogService: ConfirmationDialogService,
              entityMapperService: EntityMapperService) {
    super(data, dialogRef, confirmationDialogService, entityMapperService);
  }

  delete() {
    this.entityMapper.remove<ChildSchoolRelation>(this.entity)
      .then(() => this.dialogRef.close());
  }

  ngOnInit() {
    // set whether or not we are creating this note or editing another one
    if (!this.data.creating) { this.creating = false; }
    this.child = this.data.child;
    // load all schools and set this school so that the it matches the one linked in this entity (which is a ChildSchoolRelationship)
    this.entityMapper.loadType<School>(School)
      .then((schools: School[]) => {
        this.schools = schools;
        this.selectedSchool = this.schools.find(school => school.getId() === this.entity.schoolId);
      });
  }

}
