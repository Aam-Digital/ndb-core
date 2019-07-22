import {Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {ConfirmationDialogService} from '../confirmation-dialog/confirmation-dialog.service';
import {Entity} from '../../entity/entity';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {ColumnDescription} from './column-description';
import { MediaObserver, MediaChange} from '@angular/flex-layout';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-entity-subrecord',
  templateUrl: './entity-subrecord.component.html',
  styleUrls: ['./entity-subrecord.component.scss']
})
export class EntitySubrecordComponent implements OnInit, OnChanges, OnDestroy {

  @Input() records: Array<Entity>;
  @Input() columns: Array<ColumnDescription>;
  @Input() newRecordFactory: () => Entity;
  @Input() detailsComponent: typeof Component;
  @Input() showButton = true;

  recordsDataSource = new MatTableDataSource();
  columnsToDisplay = [];
  recordsEditing = new Map<string, boolean>();
  originalRecords = [];
  screenWidth = '';
  flexMediaWatcher: Subscription;


  @ViewChild(MatSort, { static: true }) sort: MatSort;


  constructor(private _entityMapper: EntityMapperService,
              private _snackBar: MatSnackBar,
              private _confirmationDialog: ConfirmationDialogService,
              private dialog: MatDialog,
              private media: MediaObserver) {
    this.flexMediaWatcher = this.media.media$.subscribe((change: MediaChange) => {
      if (change.mqAlias !== this.screenWidth) {
        this.screenWidth = change.mqAlias;
        this.setupTable();
      }
    });
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
      this.setupTable();
    }
  }

  ngOnDestroy() {
    this.flexMediaWatcher.unsubscribe();
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
      Object.assign(record, originalRecord);
      this.records[index] = record;
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


  getWarningStyleClass(rec) {
    if (typeof rec.getWarningLevel === 'function') {
      return 'w-' + rec.getWarningLevel();
    } else {
      return '';
    }
  }

  autocompleteSearch(col, input) {
    if (col.allSelectValues === undefined) {
      col.allSelectValues = col.selectValues;
    }

    col.selectValues = col.allSelectValues.filter(v => v.value.includes(input) || v.label.includes(input));
  }

  /**
   * resets columnsToDisplay depending on current screensize
   */
  setupTable() {
    if (this.columns !== undefined && this.screenWidth !== '') {
      const columnsHelpArray = [];
      const entitySubrecordComponent = this;
      this.columns.forEach( function(this, col) {if (entitySubrecordComponent.isVisible(col)) {
        columnsHelpArray.push(col.name);
      } } );
      this.columnsToDisplay = columnsHelpArray;
      if (this.screenWidth !== 'xs') {
        this.columnsToDisplay.push('actions');
      }
    }
  }

  /**
   * isVisible
   * compares the current screensize to the columns' property visibleFrom. screensize < visibleFrom? column not displayed
   * @param col column that is checked
   * @return returns true if column is visible
   */
  isVisible(col) {
    let returnVal;
    switch (col.visibleFrom) {
      case 'xl': {
        returnVal = (this.screenWidth.match('xl'));
        break;
      }
      case 'lg': {
        returnVal = (this.screenWidth.match('(lg|xl)'));
        break;
      }
      case 'md': {
        returnVal = (this.screenWidth.match('(md|lg|xl)'));
        break;
      }
      case 'sm': {
        returnVal = (this.screenWidth.match('(sm|md|lg|xl)'));
        break;
      }
      default: {
        returnVal = true;
      }
    }
    return returnVal;
  }

 changeVisibilityOfAddButton() {
    this.showButton = !this.showButton;
  }

}
