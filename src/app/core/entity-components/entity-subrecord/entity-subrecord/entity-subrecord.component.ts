import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort, MatSortable } from "@angular/material/sort";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { Entity } from "../../../entity/entity";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../../../alerts/alert.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { entityListSortingAccessor } from "../../entity-list/sorting-accessor";
import { FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { MatDialog } from "@angular/material/dialog";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";

export interface TableRow<T> {
  record: T;
  formGroup?: FormGroup;
}

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
export class EntitySubrecordComponent<T extends Entity> implements OnChanges {
  /**
   * Global state of pagination size for all entity subrecord components.
   *
   * When the user changes page size in one component the page size is automatically changed for other components also.
   * This ensures a consistent UI e.g. for side-by-side subrecord components of multiple attendance record tables.
   */
  static paginatorPageSize = new BehaviorSubject(10);

  /** data to be displayed */
  @Input() records: Array<T> = [];

  /** configuration what kind of columns to be generated for the table */
  @Input() columns: FormFieldConfig[] = [];

  /**
   * factory method to create a new instance of the displayed Entity type
   * used when the user adds a new entity to the list.
   */
  @Input() newRecordFactory: () => T;

  @Input() editable: boolean = true;

  /** columns displayed in the template's table */
  @Input() columnsToDisplay = [];

  /** data displayed in the template's table */
  recordsDataSource = new MatTableDataSource<TableRow<T>>();

  private mediaSubscription: Subscription;
  private screenWidth = "";

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  paginatorPageSize = EntitySubrecordComponent.paginatorPageSize.value;

  constructor(
    private _entityMapper: EntityMapperService,
    private _snackBar: MatSnackBar,
    private _confirmationDialog: ConfirmationDialogService,
    private alertService: AlertService,
    private media: MediaObserver,
    private entityFormService: EntityFormService,
    private dialog: MatDialog
  ) {
    this.mediaSubscription = this.media
      .asObservable()
      .pipe(untilDestroyed(this))
      .subscribe((change: MediaChange[]) => {
        if (change[0].mqAlias !== this.screenWidth) {
          this.screenWidth = change[0].mqAlias;
          this.setupTable();
        }
      });
  }

  @Input() showEntity = (entity: Entity, creatingNew = false) =>
    this.showEntityInForm(entity, creatingNew);

  /** function returns the background color for each entry*/
  @Input() getBackgroundColor?: (rec: T) => string = (rec: T) => rec.getColor();

  /**
   * Update the component if any of the @Input properties were changed from outside.
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.hasOwnProperty("columns") ||
      changes.hasOwnProperty("records")
    ) {
      this.initFormGroups();
      this.initDefaultSort();
      if (this.columnsToDisplay.length < 2) {
        this.setupTable();
      }
    }
    if (changes.hasOwnProperty("columnsToDisplay")) {
      this.mediaSubscription.unsubscribe();
    }
  }

  private initFormGroups() {
    this.recordsDataSource.data = this.records.map((rec) => {
      return {
        record: rec,
      };
    });
    if (this.records.length > 0) {
      try {
        this.entityFormService.extendFormFieldConfig(
          this.columns,
          this.records[0],
          true
        );
      } catch (err) {
        this.alertService.addWarning(`Error creating form definitions: ${err}`);
      }
    }
  }

  private initDefaultSort() {
    this.recordsDataSource.sort = this.sort;
    this.recordsDataSource.paginator = this.paginator;
    EntitySubrecordComponent.paginatorPageSize.subscribe((newPageSize) =>
      this.updatePagination(newPageSize)
    );
    this.recordsDataSource.sortingDataAccessor = (
      row: TableRow<T>,
      id: string
    ) => entityListSortingAccessor(row.record, id);
    if (!this.sort || this.sort.active) {
      // do not overwrite existing sort
      return;
    }

    // initial sorting by first column
    const sortBy = this.columnsToDisplay[0];
    const sortByColumn = this.columns.find((c) => c.id === sortBy);
    let sortDirection = "asc";
    if (
      sortByColumn?.view === "DisplayDate" ||
      sortByColumn?.edit === "EditDate"
    ) {
      // flip default sort order for dates (latest first)
      sortDirection = "desc";
    }

    this.sort.sort({
      id: sortBy,
      start: sortDirection,
    } as MatSortable);
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

  edit(row: TableRow<T>) {
    if (!row.formGroup) {
      row.formGroup = this.entityFormService.createFormGroup(
        this.columns,
        row.record
      );
    }
    row.formGroup.enable();
  }

  /**
   * Save an edited record to the database (if validation succeeds).
   * @param row The entity to be saved.
   */
  async save(row: TableRow<T>) {
    try {
      await this.entityFormService.saveChanges(row.formGroup, row.record);
      row.formGroup.disable();
    } catch (err) {
      this.alertService.addDanger(err.message);
    }
  }

  /**
   * Discard any changes to the given entity and reset it to the state before the user started editing.
   * @param row The entity to be reset.
   */
  resetChanges(row: TableRow<T>) {
    row.formGroup = null;
  }

  /**
   * Delete the given entity from the database (after explicit user confirmation).
   * @param row The entity to be deleted.
   */
  delete(row: TableRow<T>) {
    const dialogRef = this._confirmationDialog.openDialog(
      "Delete?",
      "Are you sure you want to delete this record?"
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._entityMapper
          .remove(row.record)
          .then(() => this.removeFromDataTable(row));

        const snackBarRef = this._snackBar.open("Record deleted", "Undo", {
          duration: 8000,
        });
        snackBarRef.onAction().subscribe(() => {
          this._entityMapper.save(row.record, true);
          this.records.unshift(row.record);
          this.initFormGroups();
        });
      }
    });
  }

  private removeFromDataTable(row: TableRow<T>) {
    const index = this.records.findIndex(
      (a) => a.getId() === row.record.getId()
    );
    if (index > -1) {
      this.records.splice(index, 1);
      this.initFormGroups();
    }
  }

  /**
   * Create a new entity.
   * The entity is only written to the database when the user saves this record which is newly added in edit mode.
   */
  create() {
    const newRecord = this.newRecordFactory();

    if (this.records.length === 0) {
      this.entityFormService.extendFormFieldConfig(
        this.columns,
        newRecord,
        true
      );
    }

    const newRow: TableRow<T> = {
      record: newRecord,
      formGroup: this.entityFormService.createFormGroup(
        this.columns,
        newRecord
      ),
    };
    this.records.unshift(newRecord);
    this.recordsDataSource.data = [newRow].concat(this.recordsDataSource.data);

    this.showEntity(newRecord, true);
  }

  /**
   * Show one record's details in a modal dialog (if configured).
   * @param row The entity whose details should be displayed.
   */
  rowClick(row: TableRow<T>) {
    if (!row.formGroup || row.formGroup.disabled) {
      this.showEntity(row.record);
    }
  }

  private showEntityInForm(entity: Entity, creatingNew = false) {
    const dialogRef = this.dialog.open(EntityFormComponent, {
      width: "80%",
    });
    const columnsCopy = [];
    this.columns.forEach((col) => {
      const newCol = {};
      Object.assign(newCol, col);
      columnsCopy.push([newCol]);
    });
    dialogRef.componentInstance.columns = columnsCopy;
    dialogRef.componentInstance.entity = entity;
    dialogRef.componentInstance.creatingNew = creatingNew;
    dialogRef.componentInstance.onSave.subscribe(() => {
      dialogRef.close();
      this.recordsDataSource.data
        .find((row) => row.record === entity)
        ?.formGroup.disable();
    });
  }

  /**
   * resets columnsToDisplay depending on current screensize
   */
  setupTable() {
    if (this.columns !== undefined && this.screenWidth !== "") {
      this.columnsToDisplay = this.columns
        .filter((col) => this.isVisible(col))
        .map((col) => col.id);
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
  private isVisible(col: FormFieldConfig): boolean {
    const visibilityGroups = ["sm", "md", "lg", "xl"];
    const visibleFromIndex = visibilityGroups.indexOf(col.visibleFrom);
    if (visibleFromIndex !== -1) {
      const regex = visibilityGroups.slice(visibleFromIndex).join("|");
      return !!this.screenWidth.match(regex);
    } else {
      return true;
    }
  }
}
