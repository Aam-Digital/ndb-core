import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {AttendanceMonth} from '../attendance-month';

@Component({
  selector: 'app-attendance-details',
  templateUrl: './attendance-details.component.html',
  styleUrls: ['./attendance-details.component.scss']
})
export class AttendanceDetailsComponent implements OnInit {
  @Input() entity: AttendanceMonth;
  originalEntity: AttendanceMonth;
  @ViewChild('recordForm', { static: true }) form;


  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              public dialogRef: MatDialogRef<AttendanceDetailsComponent>,
              private confirmationDialog: ConfirmationDialogService,
              private entityMapper: EntityMapperService) {
    this.entity = data.entity;
    this.originalEntity = Object.assign({}, this.entity);

    this.dialogRef.beforeClose().subscribe((returnedEntity) => {
      if (!returnedEntity && this.form.dirty) {
        this.confirmationDialog.openDialog('Save Changes?', 'Do you want to save the changes you made to the record?')
          .afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.save();
          } else {
            this.cancel();
          }
        });
      }
    });
  }

  ngOnInit() {
  }

  save() {
    this.entityMapper.save(this.entity, true);
    this.dialogRef.close(this.entity);
  }

  cancel() {
    Object.assign(this.entity, this.originalEntity);
    this.dialogRef.close(this.entity);
  }
}
