import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, } from "@angular/core";
import { MatSort, MatSortModule, Sort, SortDirection, } from "@angular/material/sort";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { AlertService } from "../../../alerts/alert.service";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntityForm, EntityFormService, } from "../../entity-form/entity-form.service";
import { LoggingService } from "../../../logging/logging.service";
import { AnalyticsService } from "../../../analytics/analytics.service";
import { EntityActionsService } from "../../../entity/entity-actions/entity-actions.service";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { tableSort } from "./table-sort";
import { ScreenSize, ScreenWidthObserver, } from "../../../../utils/media/screen-size-observer.service";
import { Subscription } from "rxjs";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import { ColumnConfig, DataFilter, toFormFieldConfig, } from "./entity-subrecord-config";
import { FilterService } from "../../../filter/filter.service";
import { FormDialogService } from "../../../form-dialog/form-dialog.service";
import { Router } from "@angular/router";
import { NgForOf, NgIf } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  DisableEntityOperationDirective
} from "../../../permissions/permission-directive/disable-entity-operation.directive";
import { Angulartics2Module } from "angulartics2";
import { ListPaginatorComponent } from "../list-paginator/list-paginator.component";
import { MatCheckboxChange, MatCheckboxModule, } from "@angular/material/checkbox";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { applyUpdate } from "../../../entity/model/entity-update";
import { FormFieldComponent } from "../../entity-form/form-field/form-field.component";

export interface TableRow<T extends Entity> {
  record: T;
  formGroup?: EntityForm<T>;
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
  imports: [
    NgIf,
    MatProgressBarModule,
    MatTableModule,
    MatSortModule,
    NgForOf,
    MatTooltipModule,
    DynamicComponentDirective,
    MatButtonModule,
    FontAwesomeModule,
    DisableEntityOperationDirective,
    Angulartics2Module,
    ListPaginatorComponent,
    MatCheckboxModule,
    MatSlideToggleModule,
    FormFieldComponent,
  ],
  standalone: true,
})
export class EntitySubrecordComponent<T extends Entity> implements OnChanges {
  @Input() isLoading: boolean;
  @Input() clickMode: "popup" | "navigate" | "none" = "popup";

  /**
   * outputs an event containing an array of currently selected records (checkmarked by the user)
   *
   * Checkboxes to select rows are only displayed if you set "selectable" also.
   */
  @Output() selectedRecordsChange: EventEmitter<T[]> = new EventEmitter<T[]>();
  @Input() selectedRecords: T[] = [];
  readonly COLUMN_ROW_SELECT = "_selectRows";
  @Input() selectable: boolean = false;

  @Input() showInactive = false;
  @Output() showInactiveChange = new EventEmitter<boolean>();

  /** configuration what kind of columns to be generated for the table */
  @Input() set columns(columns: ColumnConfig[]) {
    if (columns) {
      this._columns = columns.map(toFormFieldConfig);
      this.filteredColumns = this._columns.filter((col) => !col.hideFromTable);
      this.idForSavingPagination = this._columns.map((col) => col.id).join("");
    }
  }

  _columns: FormFieldConfig[] = [];
  filteredColumns: FormFieldConfig[] = [];

  /** data to be displayed, can also be used as two-way-binding */
  @Input() records: T[] = [];

  /** output the currently displayed records, whenever filters for the user change */
  @Output() filteredRecordsChange = new EventEmitter<T[]>(true);

  /**
   * factory method to create a new instance of the displayed Entity type
   * used when the user adds a new entity to the list.
   */
  @Input() newRecordFactory: () => T;

  private entityConstructor: EntityConstructor<T>;

  /**
   * Whether the rows of the table are inline editable and new entries can be created through the "+" button.
   */
  @Input() editable = true;

  /** columns displayed in the template's table */
  @Input() columnsToDisplay: string[] = [];

  /** how to sort data by default during initialization */
  @Input() defaultSort: Sort;

  /** data displayed in the template's table */
  recordsDataSource = new MatTableDataSource<TableRow<T>>();

  private updateSubscription: Subscription;
  private mediaSubscription: Subscription = Subscription.EMPTY;
  private screenWidth: ScreenSize | undefined = undefined;

  idForSavingPagination = "startWert";

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  /**
   * Event triggered when the user clicks on a row (i.e. entity).
   * This does not change the default behavior like opening popup form,
   * you may want to additionally set `clickMode` to change that.
   */
  @Output() rowClick = new EventEmitter<T>();

  /**
   * Adds a filter for the displayed data.
   * Only data, that passes the filter will be shown in the table.
   * @param filter a valid MongoDB Query
   */
  @Input() filter: DataFilter<T>;
  private predicate: (entity: T) => boolean = () => true;

  constructor(
    private alertService: AlertService,
    private screenWidthObserver: ScreenWidthObserver,
    private entityFormService: EntityFormService,
    private formDialog: FormDialogService,
    private router: Router,
    private analyticsService: AnalyticsService,
    private loggingService: LoggingService,
    public entityRemoveService: EntityActionsService,
    private entityMapper: EntityMapperService,
    private filterService: FilterService,
  ) {
    this.mediaSubscription = this.screenWidthObserver
      .shared()
      .pipe(untilDestroyed(this))
      .subscribe((change: ScreenSize) => {
        this.screenWidth = change;
        this.setupTable();
      });
  }

  /** function returns the background color for each row*/
  @Input() getBackgroundColor?: (rec: T) => string = (rec: T) => rec.getColor();

  private initDataSource() {
    this.filter = this.filter ?? ({} as DataFilter<T>);
    this.filterActiveInactive();
    this.predicate = this.filterService.getFilterPredicate(this.filter);

    this.recordsDataSource.data = this.records
      .filter(this.predicate)
      .map((record) => ({ record }));
  }

  private entityConstructorIsAvailable(): boolean {
    return this.records.length > 0 || !!this.newRecordFactory;
  }

  getEntityConstructor(): EntityConstructor<T> {
    if (!this.entityConstructorIsAvailable()) {
      throw new Error("No constructor is available");
    }

    if (!this.entityConstructor) {
      const record =
        this.records.length > 0 ? this.records[0] : this.newRecordFactory();
      this.entityConstructor = record.getConstructor();
    }
    return this.entityConstructor;
  }

  /**
   * Update the component if any of the @Input properties were changed from outside.
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    let reinitDataSource = false;
    let resetupTable = false;
    let reinitFormGroups = false;

    if (changes.hasOwnProperty("records")) {
      if (!this.records) {
        this.records = [];
      }
      reinitDataSource = true;

      if (this.records.length > 0) {
        if (!this.newRecordFactory) {
          this.newRecordFactory = () =>
            new (this.records[0].getConstructor())();
        }
        reinitFormGroups = true;
        if (this.columnsToDisplay.length < 2) {
          resetupTable = true;
        }
      }
    }
    if (
      (changes.hasOwnProperty("filter") && this.filter) ||
      changes.hasOwnProperty("showInactive")
    ) {
      reinitDataSource = true;
    }
    if (changes.hasOwnProperty("columns")) {
      reinitFormGroups = true;
      if (this.columnsToDisplay.length < 2) {
        resetupTable = true;
      }
    }
    if (changes.hasOwnProperty("columnsToDisplay")) {
      this.mediaSubscription.unsubscribe();
      resetupTable = true;
    }
    if (
      changes.hasOwnProperty("editable") ||
      changes.hasOwnProperty("selectable")
    ) {
      resetupTable = true;
    }

    if (reinitDataSource) {
      this.initDataSource();
    }
    if (reinitFormGroups) {
      this.initFormGroups();
    }
    if (resetupTable) {
      this.setupTable();
    }
    if (changes.hasOwnProperty("records")) {
      this.sortDefault();
    }

    this.filteredRecordsChange.emit(
      this.recordsDataSource.filteredData.map((item) => item.record),
    );
    this.listenToEntityUpdates();
  }

  private initFormGroups() {
    if (this.entityConstructorIsAvailable()) {
      try {
        this.filteredColumns = this.filteredColumns.map((c) =>
          this.entityFormService.extendFormFieldConfig(
            c,
            this.getEntityConstructor(),
            true,
          ),
        );
      } catch (err) {
        this.loggingService.warn(`Error creating form definitions: ${err}`);
      }
    }
  }

  private sortDefault() {
    if (
      this.records.length === 0 ||
      this.filteredColumns.length === 0 ||
      this.sort.active
    ) {
      // do not overwrite existing sort
      return;
    }

    this.recordsDataSource.sort = this.sort;

    this.recordsDataSource.sortData = (data, sort) =>
      tableSort(data, {
        active: sort.active as keyof T | "",
        direction: sort.direction,
      });

    this.defaultSort = this.defaultSort ?? this.inferDefaultSort();

    this.sort.sort({
      id: this.defaultSort.active,
      start: this.defaultSort.direction,
      disableClear: false,
    });
  }

  private inferDefaultSort(): Sort {
    // initial sorting by first column, ensure that not the 'action' column is used
    const sortBy = this.columnsToDisplay.filter(
      (c) => c !== "actions" && c !== this.COLUMN_ROW_SELECT,
    )[0];
    const sortByColumn = this.filteredColumns.find((c) => c.id === sortBy);

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

  private listenToEntityUpdates() {
    if (!this.updateSubscription && this.entityConstructorIsAvailable()) {
      this.updateSubscription = this.entityMapper
        .receiveUpdates(this.getEntityConstructor())
        .pipe(untilDestroyed(this))
        .subscribe((next) => {
          this.records = applyUpdate(this.records, next, true);

          if (this.predicate(next.entity)) {
            this.initDataSource();
          } else {
            // hide after a short delay to give a signal in the UI why records disappear by showing the changed values first
            setTimeout(() => this.initDataSource(), 5000);
          }
        });
    }
  }

  edit(row: TableRow<T>) {
    if (this.screenWidthObserver.isDesktop()) {
      if (!row.formGroup) {
        row.formGroup = this.entityFormService.createFormGroup(
          this.filteredColumns,
          row.record,
          true,
        );
      }
      row.formGroup.enable();
    } else {
      this.showEntity(row.record);
    }
  }

  /**
   * Save an edited record to the database (if validation succeeds).
   * @param row The entity to be saved.
   */
  async save(row: TableRow<T>): Promise<void> {
    try {
      row.record = await this.entityFormService.saveChanges(
        row.formGroup,
        row.record,
      );
      row.formGroup.disable();
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
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
   * Create a new entity.
   * The entity is only written to the database when the user saves this record which is newly added in edit mode.
   */
  create() {
    const newRecord = this.newRecordFactory();
    this.showEntity(newRecord);
    this.analyticsService.eventTrack("subrecord_add_new", {
      category: newRecord.getType(),
    });
  }

  /**
   * Show one record's details in a modal dialog (if configured).
   * @param row The entity whose details should be displayed.
   */
  onRowClick(row: TableRow<T>) {
    if (!row.formGroup || row.formGroup.disabled) {
      this.showEntity(row.record);
      this.analyticsService.eventTrack("subrecord_show_popup", {
        category: row.record.getType(),
      });
    }
  }

  private showEntity(entity: T) {
    switch (this.clickMode) {
      case "popup":
        this.formDialog.openFormPopup(entity, this._columns);
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

  /**
   * resets columnsToDisplay depending on current screensize
   */
  private setupTable() {
    let columns =
      this.columnsToDisplay?.filter((c) =>
        this.filteredColumns.some((column) => column.id === c),
      ) ?? [];

    if (
      !(columns.length > 0) &&
      this.filteredColumns !== undefined &&
      this.screenWidth !== undefined
    ) {
      columns = [
        ...this._columns
          .filter((col) => this.isVisible(col))
          .map((col) => col.id),
      ];
    }

    if (this.editable) {
      columns.unshift("actions");
    }
    if (this.selectable) {
      // only show selection checkboxes if Output is used in parent
      columns.unshift(this.COLUMN_ROW_SELECT);
    }

    this.columnsToDisplay = [...columns];
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
    // when `ScreenSize[col.visibleFrom]` is undefined, this returns `true`
    const numericValue = ScreenSize[col.visibleFrom];
    if (numericValue === undefined) {
      return true;
    }
    return this.screenWidthObserver.currentScreenSize() >= numericValue;
  }

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

  filterActiveInactive() {
    if (this.showInactive) {
      // @ts-ignore type has issues with getters
      delete this.filter.isActive;
    } else {
      this.filter["isActive"] = true;
    }
  }

  setActiveInactiveFilter(newValue: boolean) {
    if (newValue !== this.showInactive) {
      this.showInactive = newValue;
      this.showInactiveChange.emit(newValue);
    }
    this.initDataSource();
  }
}
