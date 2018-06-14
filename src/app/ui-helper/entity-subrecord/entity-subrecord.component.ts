import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {MatDialog, MatSnackBar, MatSort, MatTableDataSource} from '@angular/material';
import {ConfirmationDialogService} from '../confirmation-dialog/confirmation-dialog.service';
import {Entity} from '../../entity/entity';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {ColumnDescription} from './column-description';

@Component({
  selector: 'app-entity-subrecord',
  templateUrl: './entity-subrecord.component.html',
  styleUrls: ['./entity-subrecord.component.scss']
})
export class EntitySubrecordComponent implements OnInit, OnChanges {

  @Input() records: Array<Entity>;
  @Input() columns: Array<ColumnDescription>;
  @Input() newRecordFactory: () => Entity;
  @Input() detailsComponent: typeof Component;

  recordsDataSource = new MatTableDataSource();
  columnsToDisplay = [];
  recordsEditing = new Map<string, boolean>();
  originalRecords = [];

  @ViewChild(MatSort) sort: MatSort;


  constructor(private _entityMapper: EntityMapperService,
              private _snackBar: MatSnackBar,
              private _confirmationDialog: ConfirmationDialogService,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.recordsDataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['records'] && this.records !== undefined) {
      this.recordsDataSource.data = this.records;

      this.records.forEach(e => this.originalRecords.push(Object.assign({}, e)));
    }
    if (changes['columns']) {
      this.columnsToDisplay = this.columns.map(e => e.name);
      this.columnsToDisplay.push('actions');
    }
  }


  save(record: Entity) {
    this._entityMapper.save(record);

    // updated backup copies used for reset
    const i = this.originalRecords.findIndex(e => e.entityId === record.getId());
    this.originalRecords[i] = Object.assign({}, record);

    this.recordsEditing.set(record.getId(), false);
  }

  resetChanges(record: Entity) {
    // reload original record from database
    const index = this.records.findIndex(a => a.getId() === record.getId());
    if (index > -1) {
      const originalRecord = this.originalRecords.find(e => e.entityId === record.getId());
      this.records[index] = record.load(originalRecord);
      this.recordsDataSource.data = this.records;
    }

    this.recordsEditing.set(record.getId(), false);
  }

  private removeFromDataTable(record: Entity) {
    const index = this.records.findIndex(a => a.getId() === record.getId());
    if (index > -1) {
      this.records.splice(index, 1);
      this.recordsDataSource.data = this.records;
    }
  }

  delete(record: Entity) {
    const dialogRef = this._confirmationDialog
      .openDialog('Delete?', 'Are you sure you want to delete this record?');

    dialogRef.afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this._entityMapper.remove(record);
          this.removeFromDataTable(record);

          const snackBarRef = this._snackBar.open('Record deleted', 'Undo', { duration: 8000 });
          snackBarRef.onAction().subscribe(() => {
            this._entityMapper.save(record, true);
            this.records.unshift(record);
            this.recordsDataSource.data = this.records;
          });
        }
      });
  }

  create() {
    const newRecord = this.newRecordFactory();

    this.records.unshift(newRecord);
    this.originalRecords.unshift(Object.assign({}, newRecord));
    this.recordsDataSource.data = this.records;

    if (this.detailsComponent === undefined) {
      // edit inline in table
      this.recordsEditing.set(newRecord.getId(), true);
    } else {
      // open in modal for comfortable editing
      this.showRecord(newRecord);
    }
  }


  showRecord(record: Entity) {
    if (this.detailsComponent === undefined || this.recordsEditing.get(record.getId())) {
      return;
    }

    this.dialog.open(this.detailsComponent, {width: '80%', data: {entity: record}});
  }

}
