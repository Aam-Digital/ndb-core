import { Component, Inject } from '@angular/core';
import { AttendanceMonth } from '../model/attendance-month';
import { AbstractDetailsComponent } from '../../../core/ui-helper/AbstractDetailsComponent';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';
import { ConfirmationDialogService } from '../../../core/ui-helper/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-attendance-details',
  templateUrl: './attendance-details.component.html',
  styleUrls: ['./attendance-details.component.scss'],
})
export class AttendanceDetailsComponent extends AbstractDetailsComponent<AttendanceMonth> {

  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              dialogRef: MatDialogRef<AttendanceDetailsComponent>,
              confirmationDialog: ConfirmationDialogService,
              entityMapper: EntityMapperService) {
    super(data, dialogRef, confirmationDialog, entityMapper);
  }
}
