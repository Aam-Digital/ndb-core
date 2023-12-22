import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { EntityFieldEditComponent } from "../entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "../entity-field-view/entity-field-view.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { MatButtonModule } from "@angular/material/button";
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from "@angular/material/checkbox";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import {
  MatSort,
  MatSortModule,
  Sort,
  SortDirection,
} from "@angular/material/sort";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import {
  EntityForm,
  EntityFormService,
} from "../entity-form/entity-form.service";
import { tableSort } from "./table-sort/table-sort";
import { UntilDestroy } from "@ngneat/until-destroy";
import { entityFilterPredicate } from "../../filter/filter-generator/filter-predicate";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { Router } from "@angular/router";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";
import { EntityInlineEditActionsComponent } from "./entity-inline-edit-actions/entity-inline-edit-actions.component";

/**
 * A simple display component (no logic and transformations) to display a table of entities.
 */
@UntilDestroy()
@Component({
  selector: "app-entities-table",
  standalone: true,
  imports: [
    CommonModule,
    Angulartics2Module,
    DisableEntityOperationDirective,
    EntityFieldEditComponent,
    EntityFieldLabelComponent,
    EntityFieldViewComponent,
    FaIconComponent,
    ListPaginatorComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    EntityInlineEditActionsComponent,
  ],
  templateUrl: "./entities-table.component.html",
  styleUrl: "./entities-table.component.scss",
})
export class EntitiesTableComponent<T extends Entity> {
  @Input() set records(value: T[]) {
    if (!value) {
      return;
    }
    this._records = value;

    this.updateFilteredData();
    this.isLoading = false;
  }
  _records: T[] = [];
  /** data displayed in the template's table */
  recordsDataSource = new MatTableDataSource<TableRow<T>>();
  isLoading: boolean = true;

  /**
   * Additional or overwritten field configurations for columns
   * @param value
   */
  @Input() set customColumns(value: ColumnConfig[]) {
    this._customColumns = value.map((c) =>
      this.entityFormService.extendFormFieldConfig(c, this.entityType),
    );
    const entityColumns = [...this.entityType.schema.keys()].map((c) =>
      toFormFieldConfig(c),
    );

    const allColumns = [...entityColumns, ...this._customColumns];
    this._columns = allColumns
      // remove duplicates (keep customColumn = last in array)
      .filter((v) => allColumns.find((c) => c.id === v.id) === v);

    if (!this.columnsToDisplay) {
      this.columnsToDisplay = this._customColumns.map((c) => c.id);
    }

    this.idForSavingPagination = this._customColumns
      .map((col) => col.id)
      .join("");
  }
  _customColumns: FormFieldConfig[];
  _columns: FormFieldConfig[] = [];

  /**
   * Manually define the columns to be shown.
   *
   * @param value
   */
  @Input() set columnsToDisplay(value: string[]) {
    if (!value || value.length === 0) {
      value = (this._customColumns ?? this._columns)
        .map((c) => c.id)
        // remove internal action columns:
        .filter((c) => !c.startsWith("__"));
    }

    const cols = [];
    if (this.selectable) {
      cols.push(this.ACTIONCOLUMN_SELECT);
    }
    if (this.editable) {
      cols.push(this.ACTIONCOLUMN_EDIT);
    }
    cols.push(...value);
    this._columnsToDisplay = cols;

    if (!this._sortBy) {
      this.sortBy = this.inferDefaultSort();
    }
  }
  _columnsToDisplay: string[];

  @Input() entityType: EntityConstructor<T>;

  /** how to sort data by default during initialization */
  @Input() set sortBy(value: Sort) {
    if (!value) {
      return;
    }

    this._sortBy = value;

    this.recordsDataSource.sort = this.sort;

    this.recordsDataSource.sortData = (data, sort) =>
      tableSort(data, {
        active: sort.active as keyof Entity | "",
        direction: sort.direction,
      });

    this.sort.sort({
      id: value.active,
      start: value.direction,
      disableClear: false,
    });
  }
  _sortBy: Sort;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  /**
   * Adds a filter for the displayed data.
   * Only data, that passes the filter will be shown in the table.
   */
  @Input() set filter(value: DataFilter<T>) {
    this._filter = value ?? {};
    this.updateFilteredData();
  }
  _filter: DataFilter<T> = {};
  /** output the currently displayed records, whenever filters for the user change */
  @Output() filteredRecordsChange = new EventEmitter<T[]>(true);

  private updateFilteredData() {
    const filterPredicate = this.filterService.getFilterPredicate(this._filter);
    const filteredData = this._records.filter(filterPredicate);
    this.recordsDataSource.data = filteredData.map((record) => ({ record }));

    this.filteredRecordsChange.emit(filteredData);
  }

  @Input() set filterFreetext(value: string) {
    this.recordsDataSource.filter = value;
  }

  /** function returns the background color for each row*/
  @Input() getBackgroundColor?: (rec: T) => string = (rec: T) => rec.getColor();
  idForSavingPagination: string;

  @Input() clickMode: "popup" | "navigate" | "none" = "popup";
  @Output() rowClick: EventEmitter<T> = new EventEmitter<T>();

  /**
   *
   *
   * BULK SELECT
   * User can use checkboxes to select multiple rows, so that parent components can execute bulk actions on them.
   *
   *
   */
  @Input() selectable: boolean = false;
  readonly ACTIONCOLUMN_SELECT = "__select";

  /**
   * outputs an event containing an array of currently selected records (checkmarked by the user)
   * Checkboxes to select rows are only displayed if you set "selectable" also.
   */
  @Output() selectedRecordsChange: EventEmitter<T[]> = new EventEmitter<T[]>();
  @Input() selectedRecords: T[] = [];

  selectRow(row: TableRow<T>, event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedRecords.push(row.record);
    } else {
      const index = this.selectedRecords.indexOf(row.record);
      if (index > -1) {
        this.selectedRecords.splice(index, 1);
      }
    }

    this.selectedRecordsChange.emit(this.selectedRecords);
  }

  /**
   * INLINE EDIT
   * User can switch a row into edit mode to change and save field values directly from within the table
   */
  @Input() editable: boolean = true;
  readonly ACTIONCOLUMN_EDIT = "__edit";
  /**
   * factory method to create a new instance of the displayed Entity type
   * used when the user adds a new entity to the list.
   */
  @Input() newRecordFactory: () => T;

  /**
   * Create a new entity.
   * The entity is only written to the database when the user saves this record which is newly added in edit mode.
   */
  create() {
    const newRecord = this.newRecordFactory();
    this.showEntity(newRecord);
  }

  /**
   * Show one record's details in a modal dialog (if configured).
   * @param row The entity whose details should be displayed.
   */
  onRowClick(row: TableRow<T>) {
    if (!row.formGroup || row.formGroup.disabled) {
      this.showEntity(row.record);
    }
  }

  private showEntity(entity: T) {
    switch (this.clickMode) {
      case "popup":
        this.formDialog.openFormPopup(entity, this.columnsToDisplay); // TODO this.formDialog.openFormPopup(entity, this._columns)
        break;
      case "navigate":
        this.router.navigate([
          entity.getConstructor().route,
          entity.getId(false),
        ]);
        break;
    }
    this.rowClick.emit(entity);
  }

  constructor(
    private entityFormService: EntityFormService,
    private formDialog: FormDialogService,
    private router: Router,
    private filterService: FilterService,
  ) {
    this.recordsDataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
  }

  private inferDefaultSort(): Sort {
    // initial sorting by first column, ensure that not the 'action' column is used
    const sortBy = (this._columnsToDisplay ?? []).filter(
      (c) => !c.startsWith("__"),
    )[0];
    const sortByColumn = this._columns.find((c) => c.id === sortBy);

    let sortDirection: SortDirection = "asc";
    if (
      sortByColumn?.viewComponent === "DisplayDate" ||
      sortByColumn?.viewComponent === "DisplayMonth"
    ) {
      // flip default sort order for dates (latest first)
      sortDirection = "desc";
    }

    return { active: sortBy, direction: sortDirection };
  }

  /**
   *
   *
   * FILTER ARCHIVED RECORDS
   * User can hide / show inactive records through a toggle
   *
   *
   */
  @Input() showInactive = false;
  @Output() showInactiveChange = new EventEmitter<boolean>();

  setActiveInactiveFilter(newValue: boolean) {
    if (newValue !== this.showInactive) {
      this.showInactive = newValue;

      const newFilter = { ...this.filter };
      if (this.showInactive) {
        delete newFilter["isActive"];
      } else {
        newFilter["isActive"] = true;
      }
      this.filter = newFilter;

      this.showInactiveChange.emit(newValue);
    }
  }
}

/**
 * Wrapper to keep additional form data for each row of an entity, required for inline editing.
 */
export interface TableRow<T extends Entity> {
  record: T;
  formGroup?: EntityForm<T>;
}

/**
 * NOT COVERED HERE:
 *
 * - RelatedTimePeriodEntity.onIsActiveFilterChange
 */
