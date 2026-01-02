import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  inject,
  Input,
  Output,
  QueryList,
  ViewChild,
} from "@angular/core";
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
import {
  MatColumnDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from "@angular/material/table";
import { Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { EntityFieldEditComponent } from "../../entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../../entity/entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "../../entity/entity-field-view/entity-field-view.component";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { entityFilterPredicate } from "../../filter/filter-generator/filter-predicate";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { EntityCreateButtonComponent } from "../entity-create-button/entity-create-button.component";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { EntityInlineEditActionsComponent } from "./entity-inline-edit-actions/entity-inline-edit-actions.component";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { TableRow } from "./table-row";
import { tableSort } from "./table-sort/table-sort";
import { TableStateUrlService } from "./table-state-url.service";

/**
 * A simple display component (no logic and transformations) to display a table of entities.
 */
@UntilDestroy()
@Component({
  selector: "app-entities-table",
  imports: [
    EntityFieldEditComponent,
    EntityFieldLabelComponent,
    EntityFieldViewComponent,
    ListPaginatorComponent,
    MatCheckboxModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    EntityInlineEditActionsComponent,
    EntityCreateButtonComponent,
  ],
  templateUrl: "./entities-table.component.html",
  styleUrl: "./entities-table.component.scss",
})
export class EntitiesTableComponent<
  T extends Entity,
> implements AfterContentInit {
  private entityFormService = inject(EntityFormService);
  private formDialog = inject(FormDialogService);
  private router = inject(Router);
  private filterService = inject(FilterService);
  private schemaService = inject(EntitySchemaService);
  private readonly tableStateUrl = inject(TableStateUrlService);

  @Input() set records(value: T[]) {
    if (!value) {
      return;
    }
    this._records = value;

    this.updateFilteredData();
    this.isLoading = false;
  }

  private lastSelectedRow: TableRow<T> | null = null;
  private lastSelection: boolean = null;
  _records: T[] = [];
  /** data displayed in the template's table */
  recordsDataSource: MatTableDataSource<TableRow<T>>;
  isLoading: boolean = true;

  @ViewChild(MatTable, { static: true }) table: MatTable<T>;
  @ContentChildren(MatColumnDef) projectedColumns: QueryList<MatColumnDef>;

  ngAfterContentInit() {
    // dynamically add columns from content-projection (https://stackoverflow.com/a/58017564/1473411)
    this.projectedColumns.forEach((columnDef) =>
      this.table.addColumnDef(columnDef),
    );
  }

  /**
   * Additional or overwritten field configurations for columns
   * @param value
   */
  @Input() set customColumns(value: ColumnConfig[]) {
    this._customColumns = (value ?? []).map((c) =>
      this._entityType
        ? this.entityFormService.extendFormFieldConfig(c, this._entityType)
        : toFormFieldConfig(c),
    );
    const entityColumns = this._entityType?.schema
      ? [...this._entityType.schema.entries()].map(
          ([id, field]) => ({ ...field, id }) as FormFieldConfig,
        )
      : [];

    this._columns = [
      ...entityColumns.filter(
        // if there is a customColumn for a field from entity config, don't add the base schema field
        (c) => !this._customColumns.some((customCol) => customCol.id === c.id),
      ),
      ...this._customColumns,
    ];
    this._columns.forEach((c) => this.disableSortingHeaderForAdvancedFields(c));

    if (!this.columnsToDisplay) {
      this.columnsToDisplay = this._customColumns
        .filter((c) => !c.hideFromTable)
        .map((c) => c.id);
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
      value = (this._customColumns ?? this._columns).map((c) => c.id);
    }
    value = value.filter((c) => !c.startsWith("__")); // remove internal action columns

    const cols = [];
    if (this._selectable) {
      cols.push(this.ACTIONCOLUMN_SELECT);
    }
    if (this._editable) {
      cols.push(this.ACTIONCOLUMN_EDIT);
    }
    cols.push(...value);
    this._columnsToDisplay = cols;

    if (!this.sortManuallySet && !this.tableStateUrl.getUrlParam("sortBy")) {
      // Only set default sort if not manually set and/or present in URL
      this._sortBy = this.inferDefaultSort(); // do not use sortBy setter to avoid persisting to URL
    }
  }

  _columnsToDisplay: string[] = [];

  @Input() set entityType(value: EntityConstructor<T>) {
    this._entityType = value;
    this.customColumns = this._customColumns;
  }

  _entityType: EntityConstructor<T>;

  /** how to sort data by default during initialization */
  @Input() set sortBy(value: Sort) {
    if (!value) {
      return;
    }

    this._sortBy = value;

    // Persist sort state to URL
    if (value.active) {
      this.tableStateUrl.updateUrlParams({
        sortBy: value.active,
        sortOrder: value.direction ?? "asc",
      });
    }

    this.sortManuallySet = true;
  }

  _sortBy: Sort;

  @ViewChild(MatSort, { static: false }) set sort(sort: MatSort) {
    this.recordsDataSource.sort = sort;
    if (sort) {
      // Restore sort state from URL on init
      const urlSortBy = this.tableStateUrl.getUrlParam("sortBy");
      const urlSortOrder = this.tableStateUrl.getUrlParam(
        "sortOrder",
      ) as SortDirection;
      if (urlSortBy) {
        sort.active = urlSortBy;
        sort.direction = urlSortOrder || "asc";
      }
      // Listen for sort changes to persist to URL
      sort.sortChange.subscribe(({ active, direction }) => {
        if (!direction) {
          this.tableStateUrl.updateUrlParams({ sortBy: null, sortOrder: null });
        } else if (direction === "desc") {
          this.tableStateUrl.updateUrlParams({
            sortBy: active,
            sortOrder: "desc",
          });
        } else {
          this.tableStateUrl.updateUrlParams({
            sortBy: active,
            sortOrder: null,
          });
        }
      });
    }
  }

  /**
   * Indicates whether the current sort order was manually set by the user
   * to avoid overwriting it with the default sort
   */
  private sortManuallySet: boolean;

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
    this.addActiveInactiveFilter(this._filter);
    const filterPredicate = this.filterService.getFilterPredicate(this._filter);
    const filteredData = this._records.filter(filterPredicate);
    this.recordsDataSource.data = filteredData.map((record) => ({ record }));

    this.filteredRecordsChange.emit(filteredData);
  }

  @Input() set filterFreetext(value: string) {
    this.recordsDataSource.filter = value;
  }

  /**
   * Whether the list's default row coloring should reflect each entity's color.
   */
  @Input() showEntityColor: boolean = false;

  /** function returns the background color for each row*/
  @Input() getBackgroundColor?: (rec: T) => string = (rec: T) => {
    if (this.showEntityColor) return rec.getColor();
    else return "";
  };
  idForSavingPagination: string;

  /**
   * The action the system triggers when a user clicks on an entry (row):
   * - popup: open dialog with simplified form with the given fields only
   * - navigate: route the app to the details view of the entity
   * - popup-details: open dialog with the full EntityDetails view
   * - none: do not trigger any automatic action
   */
  @Input() clickMode: "popup" | "navigate" | "popup-details" | "none" = "popup";

  /**
   * Emits the entity being clicked in the table - or the newly created entity from the "create" button.
   */
  @Output() entityClick = new EventEmitter<T>();

  /**
   * BULK SELECT
   * User can use checkboxes to select multiple rows, so that parent components can execute bulk actions on them.
   */
  @Input() set selectable(v: boolean) {
    this._selectable = v;
    this.columnsToDisplay = this._columnsToDisplay;
  }

  _selectable: boolean = false;

  readonly ACTIONCOLUMN_SELECT = "__select";

  /**
   * outputs an event containing an array of currently selected records (checkmarked by the user)
   * Checkboxes to select rows are only displayed if you set "selectable" also.
   */
  @Output() selectedRecordsChange: EventEmitter<T[]> = new EventEmitter<T[]>();
  @Input() selectedRecords: T[] = [];

  selectRow(row: TableRow<T>, checked: boolean) {
    if (checked) {
      if (!this.selectedRecords.includes(row.record)) {
        this.selectedRecords = [...this.selectedRecords, row.record];
      }
    } else if (this.selectedRecords.includes(row.record)) {
      this.selectedRecords = this.selectedRecords.filter(
        (r) => r !== row.record,
      );
    }
    this.selectedRecordsChange.emit(this.selectedRecords);
  }

  /**
   * INLINE EDIT
   * User can switch a row into edit mode to change and save field values directly from within the table
   */
  @Input() set editable(v: boolean) {
    this._editable = v;
    this.columnsToDisplay = this._columnsToDisplay;
  }

  _editable: boolean = true;
  readonly ACTIONCOLUMN_EDIT = "__edit";
  /**
   * factory method to create a new instance of the displayed Entity type
   * used when the user adds a new entity to the list.
   */
  @Input() newRecordFactory: () => T;

  /**
   * Show one record's details in a modal dialog (if configured).
   * @param row The entity whose details should be displayed.
   */
  onRowClick(row: TableRow<T>, event: MouseEvent) {
    const targetElement = event.target as HTMLElement;

    // Check if the clicked element has the 'clickable' class
    if (targetElement && targetElement.closest(".clickable")) {
      return;
    }
    if (row.formGroup && !row.formGroup.disabled) {
      return;
    }
    if (this._selectable) {
      this.selectRow(row, !this.selectedRecords?.includes(row.record));
      return;
    }
    this.showEntity(row.record);
    this.entityClick.emit(row.record);
  }

  onRowMouseDown(event: MouseEvent, row: TableRow<T>) {
    if (!this._selectable) {
      this.onRowClick(row, event);
      return;
    }

    const selectedRows = this.getSelectedRows();
    const currentIndex = selectedRows.indexOf(row);
    const anchorIndex = this.lastSelectedRow
      ? selectedRows.indexOf(this.lastSelectedRow)
      : -1;

    const isCheckboxClick =
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox";

    const canRangeSelect =
      event.shiftKey &&
      this.lastSelectedRow &&
      anchorIndex !== -1 &&
      currentIndex !== -1;

    if (canRangeSelect) {
      const start = Math.min(anchorIndex, currentIndex);
      const end = Math.max(anchorIndex, currentIndex);
      const shouldCheck =
        this.lastSelection !== null
          ? !this.lastSelection
          : !this.selectedRecords.includes(row.record);

      for (let i = start; i <= end; i++) {
        const rowToSelect = selectedRows[i];
        const isSelected = this.selectedRecords.includes(rowToSelect.record);

        if (shouldCheck && !isSelected) {
          this.selectedRecords.push(rowToSelect.record);
        } else if (!shouldCheck && isSelected) {
          this.selectedRecords = this.selectedRecords.filter(
            (record) => record !== rowToSelect.record,
          );
        }
      }
      this.selectedRecordsChange.emit(this.selectedRecords);
    } else {
      const isSelected = this.selectedRecords.includes(row.record);
      this.selectRow(row, !isSelected);
      this.lastSelection = isSelected;
    }
    this.lastSelectedRow = currentIndex !== -1 ? row : null;

    if (isCheckboxClick) {
      this.onRowClick(row, event);
    }
  }

  onRowSelect(event: MatCheckboxChange, row: TableRow<T>) {
    this.selectRow(row, event.checked);
  }

  selectAllRows(event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedRecords = this.recordsDataSource.data.map(
        (row) => row.record,
      );
    } else {
      this.selectedRecords = [];
    }
    this.selectedRecordsChange.emit(this.selectedRecords);
  }

  isAllSelected() {
    return this.selectedRecords.length === this.recordsDataSource.data.length;
  }

  isIndeterminate() {
    return this.selectedRecords.length > 0 && !this.isAllSelected();
  }

  showEntity(entity: T) {
    switch (this.clickMode) {
      case "popup":
        this.formDialog.openFormPopup(entity, this._customColumns);
        break;
      case "popup-details":
        this.formDialog.openView(entity, "EntityDetails");
        break;
      case "navigate":
        this.router.navigate([
          entity.getConstructor().route,
          entity.isNew ? "new" : entity.getId(true),
        ]);
        break;
    }
  }

  constructor() {
    this.recordsDataSource = this.createDataSource();
  }

  private createDataSource() {
    const dataSource = new MatTableDataSource<TableRow<T>>();
    dataSource.sortData = (data, sort) =>
      tableSort(data, {
        active: sort.active as keyof Entity | "",
        direction: sort.direction,
      });
    dataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
    return dataSource;
  }

  private getSelectedRows(): TableRow<T>[] {
    const dataSource = this.recordsDataSource;
    const filteredRows = dataSource.filteredData ?? dataSource.data ?? [];
    const workingRows = [...filteredRows];

    const sorter = dataSource.sort;
    const sortedRows =
      sorter && sorter.active
        ? dataSource.sortData(workingRows, sorter)
        : workingRows;

    const paginator = dataSource.paginator;
    if (!paginator) {
      return sortedRows;
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return sortedRows.slice(startIndex, startIndex + paginator.pageSize);
  }

  private inferDefaultSort(): Sort {
    // initial sorting by first column, ensure that not the 'action' column is used
    const sortBy = this._columnsToDisplay.filter((c) => !c.startsWith("__"))[0];
    const sortByColumn = this._columns.find((c) => c.id === sortBy);

    let sortDirection: SortDirection = "asc";
    if (
      sortByColumn?.viewComponent === "DisplayDate" ||
      sortByColumn?.viewComponent === "DisplayMonth" ||
      this.schemaService.getDatatypeOrDefault(sortByColumn?.dataType) instanceof
        DateDatatype
    ) {
      // flip default sort order for dates (latest first)
      sortDirection = "desc";
    }

    return sortBy ? { active: sortBy, direction: sortDirection } : undefined;
  }

  /**
   * Advanced fields like entity references cannot be sorted sensibly yet - disable sort for them.
   * @param c
   * @private
   */
  private disableSortingHeaderForAdvancedFields(c: FormFieldConfig) {
    if (c.viewComponent === "DisplayAge") {
      // we have implemented support for age specifically
      return;
    }

    // if no dataType is defined, these are dynamic, display-only components
    if (c.isArray || c.dataType === EntityDatatype.dataType || !c.dataType) {
      c.noSorting = true;
    }
  }

  /**
   * FILTER ARCHIVED RECORDS
   * User can hide / show inactive records through a toggle
   */
  @Input() set showInactive(value: boolean) {
    if (value === this._showInactive) {
      return;
    }

    this._showInactive = value;
    this.updateFilteredData();
    this.showInactiveChange.emit(value);
  }

  _showInactive: boolean = false;
  @Output() showInactiveChange = new EventEmitter<boolean>();

  addActiveInactiveFilter(filter: DataFilter<T>) {
    if (this._showInactive) {
      delete filter["isActive"];
    } else {
      filter["isActive"] = true;
    }
  }
}
