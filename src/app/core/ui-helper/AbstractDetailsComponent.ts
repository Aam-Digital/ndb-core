import { Inject, Input, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogService } from './confirmation-dialog/confirmation-dialog.service';
import { EntityMapperService } from '../entity/entity-mapper.service';
import { Entity } from '../entity/entity';

export abstract class AbstractDetailsComponent<T extends Entity> implements OnInit {

  @Input() entity: T;
  originalEntity: T;
  @ViewChild('recordForm', { static: true }) form;

  protected constructor(@Inject(MAT_DIALOG_DATA) protected data: any,
                        protected dialogRef: MatDialogRef<AbstractDetailsComponent<T>>,
                        protected confirmationDialog: ConfirmationDialogService,
                        protected entityMapper: EntityMapperService) {
    this.entity = data.entity;
    this.originalEntity = Object.assign({}, this.entity);

    this.dialogRef.beforeClosed().subscribe( (returnedEntity) => {
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

  ngOnInit() {}

  save() {
    this.entityMapper.save<T>(this.entity);
    this.dialogRef.close(this.entity);
  }

  cancel() {
    Object.assign(this.entity, this.originalEntity);
    this.dialogRef.close(this.entity);
  }
}
