import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort } from "@angular/material/sort";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ColumnDescription } from "../column-description";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { FormValidationResult } from "../form-validation-result";
import { ColumnDescriptionInputType } from "../column-description-input-type.enum";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { Entity } from "../../../entity/entity";
import { FormDialogService } from "../../../form-dialog/form-dialog.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../../../alerts/alert.service";
import { DatePipe } from "@angular/common";
import { BehaviorSubject } from "rxjs";
import { ComponentWithConfig } from "../component-with-config";
import { entityListSortingAccessor } from "../../entity-list/sorting-accessor";

/**
 * Generically configurable component to display and edit a list of entities in a compact way
 * that can especially be used within another entity's details view to display related entities.
 *
 * For example, all Notes related to a certain Child are displayed within the Child's detail view
 * with the help of this component.
 *
 * Pagination is available, but the values are not stored. That means that every time calling
 * the component pagination starts with the initial values set in this component.
 *
 * A detailed Guide on how to use this component is available:
 * - [How to display related entities]{@link /additional-documentation/how-to-guides/display-related-entities.html}
 */
@UntilDestroy()
@Component({
  selector: "app-entity-subrecord",
  templateUrl: "./entity-subrecord.component.html",
  styleUrls: ["./entity-subrecord.component.scss"],
})
export class EntitySubrecordComponent<T extends Entity>
  implements OnInit, OnChanges, AfterViewInit {
  /**
   * Global state of pagination size for all entity subrecord components.
   *
   * When the user changes page size in one component the page size is automatically changed for other components also.
   * This ensures a consistent UI e.g. for side-by-side subrecord components of multiple attendance record tables.
   */
  static paginatorPageSize = new BehaviorSubject(10);

  /** data to be displayed */
  @Input() records: Array<T>;

  /** configuration what kind of columns to be generated for the table */
  @Input() columns: Array<ColumnDescription>;

  /**
   * factory method to create a new instance of the displayed Entity type
   * used when the user adds a new entity to the list.
   */
  @Input() newRecordFactory: () => T;

  /**
   * A Component to be used to display a detailed view or form of a single instance of the displayed entities.
   * This is displayed as a modal (hovering) dialog above the active view and allows the user to get
   * more information or more comfortable editing of a single record.
   *
   * Optionally this input can include a componentConfig property passing any values into the component,
   * which has to implement the OnInitDynamicComponent interface to receive this config.
   */
  @Input() detailsComponent: ComponentWithConfig<T>;

  /**
   * Whether the records can be edited directly in the table.
   */
  @Input() disableEditingInline: boolean;

  /**
   * Whether an "Add" button to create a new entry should be displayed as part of the form.
   * Default is "true".
   */
  @Input() showAddButton = true;

  /**
   * Optional function implementing form validation logic that takes an entity instance, checks it and returns
   * a {@link FormValidationResult} that is then handled by the EntitySubrecordComponent.
   */
  @Input() formValidation?: (record: T) => FormValidationResult;

  /**
   * Event whenever an entity in this table is changed.
   */
  @Output() changedRecordsInEntitySubrecordEvent = new EventEmitter<any>();

  /** id of the parent entity of the records being displayed. May be used for custom display logic. */
  @Input() entityId?: string;

  /** data displayed in the template's table */
  recordsDataSource = new MatTableDataSource();
  /** columns displayed in the template's table */
  columnsToDisplay = [];

  /** map of entities' ids and whether this record's table row is currently in edit mode */
  recordsEditing = new Map<string, boolean>();
  /** backup copies of the original state of records to allow reset */
  private originalRecords = [];

  private screenWidth = "";

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  paginatorPageSize = EntitySubrecordComponent.paginatorPageSize.value;

  constructor(
    private _entityMapper: EntityMapperService,
    private _snackBar: MatSnackBar,
    private _confirmationDialog: ConfirmationDialogService,
    private formDialog: FormDialogService,
    private alertService: AlertService,
    private datePipe: DatePipe,
    private media: MediaObserver
  ) {
    this.media
      .asObservable()
      .pipe(untilDestroyed(this))
      .subscribe((change: MediaChange[]) => {
        if (change[0].mqAlias !== this.screenWidth) {
          this.screenWidth = change[0].mqAlias;
          this.setupTable();
        }
      });
  }

  /** function returns the background color for each entry*/
  @Input() getBackgroundColor?: (rec: T) => string = (rec: T) => rec.getColor();

  ngOnInit() {}

  /**
   * Update the component if any of the @Input properties were changed from outside.
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes["records"] && this.records !== undefined) {
      this.recordsDataSource.data = this.records;

      this.records.forEach((e) =>
        this.originalRecords.push(Object.assign({}, e))
      );
    }
    if (changes["columns"]) {
      this.columns = this.columns.map((colDef) =>
        this.applyDefaultColumnDefinitions(colDef)
      );
      this.columnsToDisplay = this.columns.map((e) => e.name);
      this.columnsToDisplay.push("actions");
      this.setupTable();
    }
  }

  ngAfterViewInit() {
    this.recordsDataSource.sort = this.sort;
    this.recordsDataSource.paginator = this.paginator;
    EntitySubrecordComponent.paginatorPageSize.subscribe((newPageSize) =>
      this.updatePagination(newPageSize)
    );
    this.recordsDataSource.sortingDataAccessor = entityListSortingAccessor;
  }

  /**
   * Set the new page size (if it changed) and trigger an update of the UI.
   * @param newPageSize
   * @private
   */
  private updatePagination(newPageSize: number) {
    if (this.paginatorPageSize === newPageSize) {
      return;
    }

    this.paginatorPageSize = newPageSize;

    setTimeout(() => {
      this.paginator.pageSize = newPageSize;
      this.paginator.page.next({
        pageIndex: this.paginator.pageIndex,
        pageSize: this.paginator.pageSize,
        length: this.paginator.length,
      });
    });
  }

  /**
   * Propagate the change of page size to all other entity subrecord components.
   * @param event
   */
  onPaginateChange(event: PageEvent) {
    if (event.pageSize !== this.paginatorPageSize) {
      EntitySubrecordComponent.paginatorPageSize.next(event.pageSize);
    }
  }

  /**
   * Set default values for optional properties that are not given.
   * @param colDef
   * @private
   */
  private applyDefaultColumnDefinitions(
    colDef: ColumnDescription
  ): ColumnDescription {
    if (!colDef.valueFunction) {
      switch (colDef.inputType) {
        case ColumnDescriptionInputType.DATE:
          colDef.valueFunction = (entity) =>
            this.datePipe.transform(entity[colDef.name], "yyyy-MM-dd");
          break;
        case ColumnDescriptionInputType.MONTH:
          colDef.valueFunction = (entity) =>
            this.datePipe.transform(entity[colDef.name], "yyyy-MM");
          break;
        case ColumnDescriptionInputType.CONFIGURABLE_ENUM:
          colDef.valueFunction = (entity) => entity[colDef.name]?.label;
          break;
        default:
          colDef.valueFunction = (entity) => entity[colDef.name];
      }
    }
    colDef.styleBuilder = colDef.styleBuilder ?? (() => Object);
    return colDef;
  }

  /**
   * Save an edited record to the database (if validation succeeds).
   * @param record The entity to be saved.
   */
  save(record: T) {
    if (this.formValidation) {
      const formValidationResult = this.formValidation(record);
      if (!formValidationResult.hasPassedValidation) {
        this.alertService.addWarning(formValidationResult.validationMessage);
        return;
      }
    }

    this._entityMapper.save(record).then(() => {
      this.changedRecordsInEntitySubrecordEvent.emit();
    });

    // updated backup copies used for reset
    const i = this.originalRecords.findIndex(
      (e) => e.entityId === record.getId()
    );
    this.originalRecords[i] = Object.assign({}, record);

    this.recordsEditing.set(record.getId(), false);
  }

  /**
   * Discard any changes to the given entity and reset it to the state before the user started editing.
   * @param record The entity to be reset.
   */
  resetChanges(record: T) {
    // reload original record from database
    const index = this.records.findIndex((a) => a.getId() === record.getId());
    if (index > -1) {
      const originalRecord = this.originalRecords.find(
        (e) => e.entityId === record.getId()
      );
      Object.assign(record, originalRecord);
      this.records[index] = record;
      this.recordsDataSource.data = this.records;
    }

    this.recordsEditing.set(record.getId(), false);
  }

  private removeFromDataTable(record: T) {
    const index = this.records.findIndex((a) => a.getId() === record.getId());
    if (index > -1) {
      this.records.splice(index, 1);
      this.recordsDataSource.data = this.records;
    }
  }

  /**
   * Delete the given entity from the database (after explicit user confirmation).
   * @param record The entity to be deleted.
   */
  delete(record: T) {
    const dialogRef = this._confirmationDialog.openDialog(
      $localize`:Confirmation dialog delete header:Delete?`,
      $localize`:Delete confirmation message:Are you sure you want to delete this record?`
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._entityMapper.remove(record).then(() => {
          this.changedRecordsInEntitySubrecordEvent.emit();
        });
        this.removeFromDataTable(record);

        const snackBarRef = this._snackBar.open(
          $localize`:Record deleted info:Record deleted`,
          "Undo",
          {
            duration: 8000,
          }
        );
        snackBarRef.onAction().subscribe(() => {
          this._entityMapper.save(record, true);
          this.records.unshift(record);
          this.recordsDataSource.data = this.records;
        });
      }
    });
  }

  /**
   * Create a new entity.
   * The entity is only written to the database when the user saves this record which is newly added in edit mode.
   */
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

  /**
   * Show one record's details in a modal dialog (if configured).
   * @param record The entity whose details should be displayed.
   */
  showRecord(record: T) {
    if (
      this.detailsComponent === undefined ||
      this.recordsEditing.get(record.getId())
    ) {
      return;
    }
    this.formDialog.openDialog(
      this.detailsComponent.component,
      record,
      this.detailsComponent.componentConfig
    );
  }

  autocompleteSearch(col, input) {
    if (col.allSelectValues === undefined) {
      col.allSelectValues = col.selectValues;
    }
    col.selectValues = col.allSelectValues.filter(
      (v) => v.value.includes(input) || v.label.includes(input)
    );
  }

  /**
   * resets columnsToDisplay depending on current screensize
   */
  setupTable() {
    if (this.columns !== undefined && this.screenWidth !== "") {
      const columnsHelpArray = [];
      const entitySubrecordComponent = this;
      this.columns.forEach(function (this, col) {
        if (entitySubrecordComponent.isVisible(col)) {
          columnsHelpArray.push(col.name);
        }
      });
      this.columnsToDisplay = columnsHelpArray;
      if (this.screenWidth !== "xs") {
        this.columnsToDisplay.push("actions");
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
      case "xl": {
        returnVal = this.screenWidth.match("xl");
        break;
      }
      case "lg": {
        returnVal = this.screenWidth.match("(lg|xl)");
        break;
      }
      case "md": {
        returnVal = this.screenWidth.match("(md|lg|xl)");
        break;
      }
      case "sm": {
        returnVal = this.screenWidth.match("(sm|md|lg|xl)");
        break;
      }
      default: {
        returnVal = true;
      }
    }
    return returnVal;
  }

  /**
   * Checks whether the given column configuration's input type is readonly
   * and therefore not changing its template in edit mode.
   * @param inputType The input type to be checked.
   */
  isReadonlyInputType(inputType: ColumnDescriptionInputType): boolean {
    return (
      inputType === ColumnDescriptionInputType.FUNCTION ||
      inputType === ColumnDescriptionInputType.READONLY
    );
  }
}
