import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  MatSort,
  MatSortModule,
  Sort,
  SortDirection,
} from "@angular/material/sort";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { AlertService } from "../../../alerts/alert.service";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import {
  EntityForm,
  EntityFormService,
} from "../../entity-form/entity-form.service";
import { LoggingService } from "../../../logging/logging.service";
import { AnalyticsService } from "../../../analytics/analytics.service";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../entity/entity-remove.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { tableSort } from "./table-sort";
import {
  ScreenSize,
  ScreenWidthObserver,
} from "../../../../utils/media/screen-size-observer.service";
import { Subscription } from "rxjs";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import {
  ColumnConfig,
  DataFilter,
  toFormFieldConfig,
} from "./entity-subrecord-config";
import { FilterService } from "../../../filter/filter.service";
import { FormDialogService } from "../../../form-dialog/form-dialog.service";
import { Router } from "@angular/router";
import { NgForOf, NgIf } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DynamicComponentDirective } from "../../../view/dynamic-components/dynamic-component.directive";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DisableEntityOperationDirective } from "../../../permissions/permission-directive/disable-entity-operation.directive";
import { Angulartics2Module } from "angulartics2";
import { ListPaginatorComponent } from "../list-paginator/list-paginator.component";

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
  ],
  standalone: true,
})
export class EntitySubrecordComponent<T extends Entity> implements OnChanges {
  @Input() isLoading: boolean;

  @Input() clickMode: "popup" | "navigate" | "none" = "popup";

  /** configuration what kind of columns to be generated for the table */
  @Input() set columns(columns: ColumnConfig[]) {
    this._columns = columns.map(toFormFieldConfig);
    this.filteredColumns = this._columns.filter((col) => !col.hideFromTable);
    this.idForSavingPagination = this._columns.map((col) => col.id).join("");
  }

  _columns: FormFieldConfig[] = [];
  filteredColumns: FormFieldConfig[] = [];

  /** data to be displayed, can also be used as two-way-binding */
  @Input()
  set records(value: T[]) {
    this._records = value;
    this.initDataSource();
    if (!this.newRecordFactory && this._records.length > 0) {
      this.newRecordFactory = () => new (this._records[0].getConstructor())();
    }
  }

  private _records: T[] = [];

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

  @ViewChild(MatSort) set sort(matSort: MatSort) {
    // Initialize sort once available, workaround according to https://github.com/angular/components/issues/15008#issuecomment-516386055
    this.recordsDataSource.sort = matSort;

    this.recordsDataSource.sortData = (data, sort) =>
      tableSort(data, {
        active: sort.active as keyof T | "",
        direction: sort.direction,
      });

    setTimeout(() => this.sortDefault());
  }

  get sort(): MatSort {
    return this.recordsDataSource.sort;
  }

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
  @Input() set filter(filter: DataFilter<T>) {
    if (filter) {
      this.predicate = this.filterService.getFilterPredicate(filter);
      this.initDataSource();
    }
  }

  private predicate: (entity: T) => boolean = () => true;

  constructor(
    private alertService: AlertService,
    private screenWidthObserver: ScreenWidthObserver,
    private entityFormService: EntityFormService,
    private formDialog: FormDialogService,
    private router: Router,
    private analyticsService: AnalyticsService,
    private loggingService: LoggingService,
    private entityRemoveService: EntityRemoveService,
    private entityMapper: EntityMapperService,
    private filterService: FilterService
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
    this.recordsDataSource.data = this._records
      .filter(this.predicate)
      .map((record) => ({ record }));
  }

  private entityConstructorIsAvailable(): boolean {
    return this._records.length > 0 || !!this.newRecordFactory;
  }

  getEntityConstructor(): EntityConstructor<T> {
    if (!this.entityConstructorIsAvailable()) {
      throw new Error("No constructor is available");
    }

    if (!this.entityConstructor) {
      const record =
        this._records.length > 0 ? this._records[0] : this.newRecordFactory();
      this.entityConstructor = record.getConstructor();
    }
    return this.entityConstructor;
  }

  /**
   * Update the component if any of the @Input properties were changed from outside.
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("columns")) {
      this.initFormGroups();
      if (this.columnsToDisplay.length < 2) {
        this.setupTable();
      }
    }
    if (changes.hasOwnProperty("records") && this._records.length > 0) {
      this.initFormGroups();
      if (this.columnsToDisplay.length < 2) {
        this.setupTable();
      }
      this.sortDefault();
    }
    if (changes.hasOwnProperty("columnsToDisplay")) {
      this.mediaSubscription.unsubscribe();
    }
    this.listenToEntityUpdates();
  }

  private initFormGroups() {
    if (this.entityConstructorIsAvailable()) {
      try {
        this.entityFormService.extendFormFieldConfig(
          this._columns,
          this.getEntityConstructor(),
          true
        );
      } catch (err) {
        this.loggingService.warn(`Error creating form definitions: ${err}`);
      }
    }
  }

  private sortDefault() {
    if (!this.sort || this._columns.length === 0 || this.sort.active) {
      // do not overwrite existing sort
      return;
    }

    if (!this.defaultSort) {
      this.defaultSort = this.inferDefaultSort();
    }

    this.sort.sort({
      id: this.defaultSort.active,
      start: this.defaultSort.direction,
      disableClear: false,
    });
  }

  private inferDefaultSort(): Sort {
    // initial sorting by first column, ensure that not the 'action' column is used
    const sortBy =
      this.columnsToDisplay[0] === "actions"
        ? this.columnsToDisplay[1]
        : this.columnsToDisplay[0];
    const sortByColumn = this._columns.find((c) => c.id === sortBy);

    let sortDirection: SortDirection = "asc";
    if (
      sortByColumn?.view === "DisplayDate" ||
      sortByColumn?.edit === "EditDate"
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
        .subscribe(({ entity, type }) => {
          if (type === "new") {
            this.addToTable(entity);
          } else if (type === "remove") {
            this.removeFromDataTable(entity);
          } else if (
            type === "update" &&
            !this._records.find((rec) => rec.getId() === entity.getId())
          ) {
            this.addToTable(entity);
          }

          if (!this.predicate(entity)) {
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
          this._columns,
          row.record,
          true
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
        row.record
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
            this.removeFromDataTable(row.record);
            break;
          case RemoveResult.UNDONE:
            this._records.unshift(row.record);
            this.initFormGroups();
        }
      });
  }

  private removeFromDataTable(deleted: T) {
    // use setter so datasource is also updated
    this.records = this._records.filter(
      (rec) => rec.getId() !== deleted.getId()
    );
  }

  private addToTable(record: T) {
    // use setter so datasource is also updated
    this.records = [record].concat(this._records);
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
        this.formDialog.openSimpleForm(entity, this._columns);
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
    if (this._columns !== undefined && this.screenWidth !== undefined) {
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
    // when `ScreenSize[col.visibleFrom]` is undefined, this returns `true`
    const numericValue = ScreenSize[col.visibleFrom];
    if (numericValue === undefined) {
      return true;
    }
    return this.screenWidthObserver.currentScreenSize() >= numericValue;
  }
}
