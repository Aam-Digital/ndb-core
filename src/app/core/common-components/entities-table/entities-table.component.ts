import {
  AfterContentInit,
  Component,
  computed,
  ContentChildren,
  effect,
  inject,
  input,
  model,
  output,
  QueryList,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
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
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { EntityFieldEditComponent } from "../../entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../../entity/entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "../../entity/entity-field-view/entity-field-view.component";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { getEntityRuntimeRoute } from "../../entity/entity-config.service";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  records = input<T[]>();
  customColumns = input<ColumnConfig[], ColumnConfig[] | undefined>([], {
    transform: (value) => value ?? [],
  });
  columnsToDisplay = input<string[]>();
  entityType = input<EntityConstructor<T>>();
  sortBy = input<Sort>();
  filter = input<DataFilter<T>, DataFilter<T> | undefined>(
    {},
    {
      transform: (value) => value ?? {},
    },
  );
  filterFreetext = input<string>();
  showEntityColor = input<boolean>(false);
  getBackgroundColor = input<(rec: T) => string>();
  clickMode = input<"popup" | "navigate" | "popup-details" | "none">("popup");
  newRecordFactory = input<() => T>();
  editable = input<boolean>(true);
  selectable = input<boolean>(false);

  filteredRecordsChange = output<T[]>();
  entityClick = output<T>();
  selectedRecords = model<T[]>([]);
  showInactive = model<boolean>(false);

  readonly effectiveBackgroundColor = computed<(rec: T) => string>(() => {
    const custom = this.getBackgroundColor();
    const useEntityColor = this.showEntityColor();
    return custom ?? ((rec: T) => (useEntityColor ? rec.getColor() : ""));
  });

  private lastSelectedRow: TableRow<T> | null = null;
  private lastSelection: boolean = null;
  readonly _customColumns = signal<FormFieldConfig[]>([]);
  readonly _columns = signal<FormFieldConfig[]>([]);
  readonly idForSavingPagination = computed(() =>
    this._customColumns()
      .map((col) => col.id)
      .join(""),
  );

  readonly isLoading = signal<boolean>(true);
  readonly _columnsToDisplay = signal<string[]>([]);
  readonly _sortBy = signal<Sort>(undefined);

  /** data displayed in the template's table */
  recordsDataSource: MatTableDataSource<TableRow<T>>;

  @ViewChild(MatTable, { static: true }) table: MatTable<T>;
  @ContentChildren(MatColumnDef) projectedColumns: QueryList<MatColumnDef>;

  ngAfterContentInit() {
    // dynamically add columns from content-projection (https://stackoverflow.com/a/58017564/1473411)
    this.projectedColumns.forEach((columnDef) =>
      this.table.addColumnDef(columnDef),
    );
  }

  /**
   * Indicates whether the current sort order was manually set by the user
   * to avoid overwriting it with the default sort
   */
  private sortManuallySet: boolean;

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
      sort.sortChange
        .pipe(untilDestroyed(this))
        .subscribe(({ active, direction }) => {
          if (!direction) {
            this.tableStateUrl.updateUrlParams({
              sortBy: null,
              sortOrder: null,
            });
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

  readonly ACTIONCOLUMN_SELECT = "__select";
  readonly ACTIONCOLUMN_EDIT = "__edit";

  constructor() {
    this.recordsDataSource = this.createDataSource();

    // Column computation effect: recomputes column state when entity type, columns config, or display settings change
    effect(() => {
      const entityType = this.entityType();
      const rawCustomColumns = this.customColumns();
      const rawColumnsToDisplay = this.columnsToDisplay();
      const selectable = this.selectable();
      const editable = this.editable();

      const mappedCustomColumns = rawCustomColumns.map((c) =>
        entityType
          ? this.entityFormService.extendFormFieldConfig(c, entityType)
          : toFormFieldConfig(c),
      );
      this._customColumns.set(mappedCustomColumns);

      const entityColumns = entityType?.schema
        ? [...entityType.schema.entries()].map(
            ([id, field]) => ({ ...field, id }) as FormFieldConfig,
          )
        : [];

      const mergedColumns = [
        ...entityColumns.filter(
          (c) =>
            !mappedCustomColumns.some((customCol) => customCol.id === c.id),
        ),
        ...mappedCustomColumns,
      ];
      mergedColumns.forEach((c) =>
        this.disableSortingHeaderForAdvancedFields(c),
      );
      this._columns.set(mergedColumns);

      let colsToDisplay = rawColumnsToDisplay;
      if (!colsToDisplay || colsToDisplay.length === 0) {
        colsToDisplay = mappedCustomColumns
          .filter((c) => !c.hideFromTable)
          .map((c) => c.id);
      }
      colsToDisplay = colsToDisplay.filter((c) => !c.startsWith("__"));

      const cols: string[] = [];
      if (selectable) cols.push(this.ACTIONCOLUMN_SELECT);
      if (editable) cols.push(this.ACTIONCOLUMN_EDIT);
      cols.push(...colsToDisplay);
      this._columnsToDisplay.set(cols);

      if (!this.sortManuallySet && !this.tableStateUrl.getUrlParam("sortBy")) {
        this._sortBy.set(this.inferDefaultSort(cols));
      }
    });

    // Data filter effect: re-filters records when data, filter, or showInactive changes
    effect(() => {
      const records = this.records();
      this.showInactive(); // track — consumed inside updateFilteredData via addActiveInactiveFilter
      if (records === undefined || records === null) return;
      const effectiveFilter = { ...this.filter() };
      this.updateFilteredData(records, effectiveFilter);
      this.isLoading.set(false);
    });

    // Sort input effect: applies external sort input
    effect(() => {
      const sortBy = this.sortBy();
      if (!sortBy) return;
      this._sortBy.set(sortBy);
      if (sortBy.active) {
        this.tableStateUrl.updateUrlParams({
          sortBy: sortBy.active,
          sortOrder: sortBy.direction ?? "asc",
        });
      }
      this.sortManuallySet = true;
    });

    // Freetext filter effect
    effect(() => {
      this.recordsDataSource.filter = this.filterFreetext() ?? "";
      this.emitFilteredRecordsFromDataSource();
    });
  }

  private updateFilteredData(records: T[], filter: DataFilter<T>) {
    this.addActiveInactiveFilter(filter);
    const filterPredicate = this.filterService.getFilterPredicate(filter);
    const filteredData = records.filter(filterPredicate);
    this.recordsDataSource.data = filteredData.map((record) => ({ record }));
    this.emitFilteredRecordsFromDataSource();
  }

  private createDataSource() {
    const dataSource = new MatTableDataSource<TableRow<T>>();
    dataSource.sortData = (data, sort) =>
      tableSort<T, keyof T>(data, {
        active: (sort.active as keyof T) ?? "",
        direction: sort.direction,
        sortValueFns: this.buildSortValueFns(),
      });
    dataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
    return dataSource;
  }

  /**
   * Builds a map of column id → sort value extractor.
   * Every datatype participates through {@link DefaultDatatype.sortValue};
   * datatypes that don't override it return `undefined` and fall back to
   * default sorting behavior in {@link tableSort}.
   */
  private buildSortValueFns(): Record<
    string,
    (v: any) => number | string | undefined
  > {
    const sortValueByColumnId: Record<
      string,
      (v: any) => number | string | undefined
    > = {};
    for (const col of this._columns()) {
      const datatype = this.schemaService.getDatatypeOrDefault(
        col.dataType,
        true,
      );
      sortValueByColumnId[col.id] = (v) => datatype.sortValue(v);
    }
    return sortValueByColumnId;
  }

  private emitFilteredRecordsFromDataSource() {
    const rows =
      this.recordsDataSource.filteredData ?? this.recordsDataSource.data ?? [];
    this.filteredRecordsChange.emit(rows.map((row) => row.record));
  }

  selectRow(row: TableRow<T>, checked: boolean) {
    if (checked) {
      if (!this.selectedRecords().includes(row.record)) {
        this.selectedRecords.set([...this.selectedRecords(), row.record]);
      }
    } else if (this.selectedRecords().includes(row.record)) {
      this.selectedRecords.set(
        this.selectedRecords().filter((r) => r !== row.record),
      );
    }
  }

  onRowClick(row: TableRow<T>, event: MouseEvent) {
    const targetElement = event.target as HTMLElement;

    // Check if the clicked element has the 'clickable' class
    if (targetElement && targetElement.closest(".clickable")) {
      return;
    }
    if (row.formGroup && !row.formGroup.disabled) {
      return;
    }
    if (this.selectable()) {
      this.selectRow(row, !this.selectedRecords()?.includes(row.record));
      return;
    }
    this.showEntity(row.record);
    this.entityClick.emit(row.record);
  }

  onRowMouseDown(event: MouseEvent, row: TableRow<T>) {
    if (!this.selectable()) {
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
          : !this.selectedRecords().includes(row.record);

      const updated = [...this.selectedRecords()];
      for (let i = start; i <= end; i++) {
        const rowToSelect = selectedRows[i];
        const isSelected = updated.includes(rowToSelect.record);

        if (shouldCheck && !isSelected) {
          updated.push(rowToSelect.record);
        } else if (!shouldCheck && isSelected) {
          updated.splice(updated.indexOf(rowToSelect.record), 1);
        }
      }
      this.selectedRecords.set(updated);
    } else {
      const isSelected = this.selectedRecords().includes(row.record);
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
      this.selectedRecords.set(
        this.recordsDataSource.data.map((row) => row.record),
      );
    } else {
      this.selectedRecords.set([]);
    }
  }

  isAllSelected() {
    return this.selectedRecords().length === this.recordsDataSource.data.length;
  }

  isIndeterminate() {
    return this.selectedRecords().length > 0 && !this.isAllSelected();
  }

  showEntity(entity: T) {
    switch (this.clickMode()) {
      case "popup":
        this.formDialog.openFormPopup(entity, this._customColumns());
        break;
      case "popup-details":
        this.formDialog.openView(entity, "EntityDetails");
        break;
      case "navigate":
        this.router.navigate([
          getEntityRuntimeRoute(entity.getConstructor()),
          entity.isNew ? "new" : entity.getId(true),
        ]);
        break;
    }
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

  private inferDefaultSort(colsToDisplay: string[]): Sort {
    // Initial sorting by first sortable user column, ignore internal action columns
    // and columns that explicitly disable sorting.
    const sortBy = colsToDisplay
      .filter((columnId) => !columnId.startsWith("__"))
      .find((columnId) => {
        const column = this._columns().find((c) => c.id === columnId);
        return !column?.noSorting;
      });
    const sortByColumn = this._columns().find((c) => c.id === sortBy);

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

    const datatype = this.schemaService.getDatatypeOrDefault(c.dataType, true);
    if (
      c.isArray &&
      datatype?.sortValue !== DefaultDatatype.prototype.sortValue
    ) {
      // datatype provides custom sort logic, keep sorting enabled
      return;
    }

    // if no dataType is defined, these are dynamic, display-only components
    if (c.isArray || c.dataType === EntityDatatype.dataType || !c.dataType) {
      c.noSorting = true;
    }
  }

  addActiveInactiveFilter(filter: DataFilter<T>) {
    if (this.showInactive()) {
      delete filter["isActive"];
    } else {
      filter["isActive"] = true;
    }
  }
}
