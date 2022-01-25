import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatSort, MatSortable } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Entity } from "../../../entity/model/entity";
import { AlertService } from "../../../alerts/alert.service";
import { Subscription } from "rxjs";
import { entityListSortingAccessor } from "./sorting-accessor";
import { FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { MatDialog } from "@angular/material/dialog";
import { LoggingService } from "../../../logging/logging.service";
import { AnalyticsService } from "../../../analytics/analytics.service";
import {
  CanDelete,
  CanSave,
  RowDetailsComponent,
} from "../row-details/row-details.component";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../entity/entity-remove.service";

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
export class EntitySubrecordComponent<T extends Entity>
  implements OnChanges, CanSave<TableRow<T>>, CanDelete<TableRow<T>> {
  /** configuration what kind of columns to be generated for the table */
  @Input() set columns(columns: (FormFieldConfig | string)[]) {
    this._columns = columns.map((col) => {
      if (typeof col === "string") {
        return { id: col };
      } else {
        return col;
      }
    });
    this.filteredColumns = this._columns.filter((col) => !col.hideFromTable);
  }
  /** data to be displayed */
  @Input() records: Array<T> = [];
  _columns: FormFieldConfig[] = [];
  filteredColumns: FormFieldConfig[] = [];

  /**
   * factory method to create a new instance of the displayed Entity type
   * used when the user adds a new entity to the list.
   */
  @Input() newRecordFactory: () => T;

  /**
   * Whether the rows of the table are inline editable and new entries can be created through the "+" button.
   */
  @Input() editable: boolean = true;

  /** columns displayed in the template's table */
  @Input() columnsToDisplay = [];

  /** data displayed in the template's table */
  recordsDataSource = new MatTableDataSource<TableRow<T>>();

  private mediaSubscription: Subscription;
  private screenWidth = "";

  public idForSavingPagination = "startWert";

  @ViewChild(MatSort) sort: MatSort;

  /**
   * A function which should be executed when a row is clicked or a new entity created.
   * @param entity The newly created or clicked entity.
   */
  @Input() showEntity?: (T) => void;

  constructor(
    private alertService: AlertService,
    private media: MediaObserver,
    private entityFormService: EntityFormService,
    private dialog: MatDialog,
    private analyticsService: AnalyticsService,
    private loggingService: LoggingService,
    private entityRemoveService: EntityRemoveService
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

  /** function returns the background color for each row*/
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
    if (this.records.length > 0 || this.newRecordFactory) {
      const entity =
        this.records.length > 0 ? this.records[0] : this.newRecordFactory();
      try {
        this.entityFormService.extendFormFieldConfig(
          this._columns,
          entity,
          true
        );
        this.idForSavingPagination = this._columns
          .map((col) => (typeof col === "object" ? col.id : col))
          .join("");
      } catch (err) {
        this.loggingService.warn(`Error creating form definitions: ${err}`);
      }
    }
    this.recordsDataSource.data = this.records.map((rec) => {
      return {
        record: rec,
      };
    });
  }

  private initDefaultSort() {
    this.recordsDataSource.sort = this.sort;
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
    const sortByColumn = this._columns.find((c) => c.id === sortBy);
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

  edit(row: TableRow<T>) {
    if (this.media.isActive("lt-sm")) {
      this.rowClick(row);
    } else {
      if (!row.formGroup) {
        row.formGroup = this.entityFormService.createFormGroup(
          this._columns,
          row.record
        );
      }
      row.formGroup.enable();
    }
  }

  /**
   * Save an edited record to the database (if validation succeeds).
   * @param row The entity to be saved.
   * @param isNew whether or not the record is new
   */
  async save(row: TableRow<T>, isNew: boolean = false): Promise<void> {
    try {
      row.record = await this.entityFormService.saveChanges(
        row.formGroup,
        row.record
      );
      if (isNew) {
        this.records.unshift(row.record);
        this.recordsDataSource.data = [{ record: row.record }].concat(
          this.recordsDataSource.data
        );
      }
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
    this.entityRemoveService
      .remove(row.record, {
        deletedEntityInformation: $localize`:Record deleted info:Record deleted`,
        dialogText: $localize`:Delete confirmation message:Are you sure you want to delete this record?`,
      })
      .subscribe((result) => {
        switch (result) {
          case RemoveResult.REMOVED:
            this.removeFromDataTable(row);
            break;
          case RemoveResult.UNDONE:
            this.records.unshift(row.record);
            this.initFormGroups();
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
  async create() {
    const newRecord = this.newRecordFactory();

    if (this.showEntity) {
      this.showEntity(newRecord);
    } else {
      this.showRowDetails({ record: newRecord }, true);
    }

    this.analyticsService.eventTrack("subrecord_add_new", {
      category: newRecord.getType(),
    });
  }

  /**
   * Show one record's details in a modal dialog (if configured).
   * @param row The entity whose details should be displayed.
   */
  rowClick(row: TableRow<T>) {
    if (!row.formGroup || row.formGroup.disabled) {
      if (this.showEntity) {
        this.showEntity(row.record);
      } else {
        this.showRowDetails(row, false);
        this.analyticsService.eventTrack("subrecord_show_popup", {
          category: row.record.getType(),
        });
      }
    }
  }

  private showRowDetails(row: TableRow<T>, isNew: boolean) {
    const columnsToDisplay = this._columns
      .filter((col) => col.edit)
      .map((col) => {
        col.forTable = false;
        return col;
      })
      .map((col) => Object.assign({}, col));
    if (isNew) {
      row.formGroup = this.entityFormService.createFormGroup(
        this._columns,
        row.record
      );
    }
    this.dialog.open(RowDetailsComponent, {
      width: "80%",
      maxHeight: "90vh",
      data: {
        row: row,
        columns: columnsToDisplay,
        viewOnlyColumns: this._columns.filter((col) => !col.edit),
        operations: this,
        isNew: isNew,
      },
    });
  }

  /**
   * resets columnsToDisplay depending on current screensize
   */
  setupTable() {
    if (this._columns !== undefined && this.screenWidth !== "") {
      this.columnsToDisplay = this._columns
        .filter((col) => this.isVisible(col))
        .map((col) => col.id);
      this.columnsToDisplay.unshift("actions");
    }
  }

  /**
   * isVisible
   * compares the current screensize to the columns' property visibleFrom. screensize < visibleFrom? column not displayed
   * @param col column that is checked
   * @return returns true if column is visible
   */
  private isVisible(col: FormFieldConfig): boolean {
    if (col.hideFromTable) {
      return false;
    }
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
