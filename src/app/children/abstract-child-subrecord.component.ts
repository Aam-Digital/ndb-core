import {MatSnackBar, MatTableDataSource} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {Entity} from '../entity/entity';
import {Observable} from 'rxjs/Observable';
import {Child} from './child';
import {ChildrenService} from './children.service';
import {ConfirmationDialogService} from '../ui-helper/confirmation-dialog/confirmation-dialog.service';

export abstract class AbstractChildSubrecordComponent<T extends Entity> {
  records: Array<T>;
  recordsDataSource = new MatTableDataSource();
  recordsEditing = new Map<string, boolean>();
  child: Child;

  abstract getRecords(childId: string): Observable<T[]>;
  abstract getRecord(recordId: string): Observable<T>;
  abstract saveRecord(record: T);
  abstract removeRecord(record: T);


  constructor(private _route: ActivatedRoute,
              private _childrenService: ChildrenService,
              private _snackBar: MatSnackBar,
              private _confirmationDialog: ConfirmationDialogService) {
  }

  protected init() {
    const params = this._route.snapshot.params;
    const childId = params['id'].toString();

    this._childrenService.getChild(childId)
      .subscribe(result => this.child = result);

    this.getRecords(childId)
      .subscribe(results => {
        this.records = results;
        this.recordsDataSource.data = this.records;
      });
  }


  save(record: T) {
    // update in database
    this.saveRecord(record);

    this.recordsEditing.set(record.getId(), false);
  }

  resetChanges(record: T) {
    // reload original record from database
    this.getRecord(record.getId())
      .subscribe(
        original => {
          const index = this.records.findIndex(a => a.getId() === record.getId());
          if (index > -1) {
            this.records[index] = original;
            this.recordsDataSource.data = this.records;
          }
        },
        err => {
          if (err.status === 404) {
            this.removeFromDataTable(record);
          }
        }
      );
    this.recordsEditing.set(record.getId(), false);
  }

  private removeFromDataTable(record: T) {
    const index = this.records.findIndex(a => a.getId() === record.getId());
    if (index > -1) {
      this.records.splice(index, 1);
      this.recordsDataSource.data = this.records;
    }
  }

  delete(record: T) {
    const dialogRef = this._confirmationDialog
      .openDialog('Delete?', 'Are you sure you want to delete this record?');

    dialogRef.afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.removeRecord(record);
          this.removeFromDataTable(record);

          const snackBarRef = this._snackBar.open('Record deleted', 'Undo', { duration: 8000 });
          snackBarRef.onAction().subscribe(() => {
            this.saveRecord(record);
            this.records.unshift(record);
            this.recordsDataSource.data = this.records;
          });
        }
      });
  }

  new(newRecord: T) {
    this.recordsEditing.set(newRecord.getId(), true);

    this.records.unshift(newRecord);
    this.recordsDataSource.data = this.records;
  }

}
