import {Component, Inject} from '@angular/core';
import {AttendanceMonth} from '../attendance-month';
import {AbstractDetailsComponent} from '../../../ui-helper/AbstractDetailsComponent';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {EntityMapperService} from '../../../entity/entity-mapper.service';

@Component({
  selector: 'app-attendance-details',
  templateUrl: './attendance-details.component.html',
  styleUrls: ['./attendance-details.component.scss']
})

export class AttendanceDetailsComponent extends AbstractDetailsComponent<AttendanceMonth> {

  // need the explicit constructor since the generic argument of MatDialogRef throws an error
  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              dialogRef: MatDialogRef<AttendanceDetailsComponent>,
              confirmationDialog: ConfirmationDialogService,
              entityMapper: EntityMapperService) {
    super(data, dialogRef, confirmationDialog, entityMapper);
  }
}
