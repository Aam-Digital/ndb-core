import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MediaObserver } from "@angular/flex-layout";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  ColumnGroupsConfig,
  EntityListConfig,
  FilterConfig,
  GroupConfig,
} from "./EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { OperationType } from "../../permissions/entity-permissions.service";
import { FormFieldConfig } from "../entity-form/entity-form/FormConfig";
import { EntitySubrecordComponent } from "../entity-subrecord/entity-subrecord/entity-subrecord.component";
import { FilterGeneratorService } from "./filter-generator.service";
import { FilterComponentSettings } from "./filter-component.settings";
import { entityFilterPredicate } from "./filter-predicate";
import { map } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { FilterOverlayComponent } from "./filter-overlay/filter-overlay.component";
import { AnalyticsService } from "../../analytics/analytics.service";

/**
 * This component allows to create a full blown table with pagination, filtering, searching and grouping.
 * The filter and grouping settings are written into the URL params to allow going back to the previous view.
 * The pagination settings are stored for each user.
 * The columns can be any kind of component.
 * The column components will be provided with the Entity object, the id for this column, as well as its static config.
 */
@Component({
  selector: "app-entity-list",
  templateUrl: "./entity-list.component.html",
  styleUrls: ["./entity-list.component.scss"],
})
export class EntityListComponent<T extends Entity>
  implements OnChanges, AfterViewInit {
  @Input() allEntities: T[] = [];
  filteredEntities: T[] = [];
  @Input() listConfig: EntityListConfig;
  @Input() entityConstructor: EntityConstructor<T>;
  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();

  @ViewChild(EntitySubrecordComponent) entityTable: EntitySubrecordComponent<T>;

  listName = "";
  columns: (FormFieldConfig | string)[] = [];
  columnGroups: GroupConfig[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  filtersConfig: FilterConfig[] = [];

  operationType = OperationType;

  columnsToDisplay: string[] = [];

  filterSelections: FilterComponentSettings<T>[] = [];
  filterString = "";

  get selectedColumnGroupIndex(): number {
    return this.selectedColumnGroupIndex_;
  }

  set selectedColumnGroupIndex(newValue: number) {
    this.selectedColumnGroupIndex_ = newValue;
    this.columnsToDisplay = this.columnGroups[newValue].columns;
  }

  selectedColumnGroupIndex_: number = 0;

  /**
   * defines the bottom margin of the topmost row in the
   * desktop version. This has to be bigger when there are
   * several column groups since there are
   * tabs with zero top-padding in this case
   */
  get offsetFilterStyle(): object {
    const bottomMargin = this.columnGroups.length > 1 ? 29 : 14;
    return {
      "margin-bottom": `${bottomMargin}px`,
    };
  }

  constructor(
    private media: MediaObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private analyticsService: AnalyticsService,
    private filterGeneratorService: FilterGeneratorService,
    private dialog: MatDialog
  ) {
    this.media
      .asObservable()
      .pipe(
        map(
          (changes) =>
            changes[0].mqAlias !== "xs" && changes[0].mqAlias !== "md"
        )
      )
      .subscribe((isBigScreen) => {
        if (isBigScreen) {
          this.displayColumnGroupByName(this.defaultColumnGroup);
        } else {
          this.displayColumnGroupByName(this.mobileColumnGroup);
        }
      });
    this.activatedRoute.queryParams.subscribe((params) => {
      this.loadUrlParams(params);
    });
  }

  ngAfterViewInit() {
    this.entityTable.recordsDataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.hasOwnProperty("listConfig")) {
      this.listName = this.listConfig.title;
      this.addColumnsFromColumnGroups();
      this.initColumnGroups(this.listConfig.columnGroups);
      this.filtersConfig = this.listConfig.filters || [];
      this.displayColumnGroupByName(this.defaultColumnGroup);
    }
    if (changes.hasOwnProperty("allEntities")) {
      await this.initFilterSelections();
      this.applyFilterSelections();
    }
    this.loadUrlParams();
  }

  private addColumnsFromColumnGroups() {
    this.columns = this.listConfig.columns || [];
    this.listConfig.columnGroups?.groups?.forEach((group) =>
      group.columns
        .filter(
          (columnId) =>
            !this.columns.some((column) =>
              // Check if the column is already defined as object or string
              typeof column === "string"
                ? column === columnId
                : column.id === columnId
            )
        )
        .forEach((column) => this.columns.push(column))
    );
  }

  private initColumnGroups(columnGroup?: ColumnGroupsConfig) {
    if (columnGroup && columnGroup.groups.length > 0) {
      this.columnGroups = columnGroup.groups;
      this.defaultColumnGroup =
        columnGroup.default || columnGroup.groups[0].name;
      this.mobileColumnGroup = columnGroup.mobile || columnGroup.groups[0].name;
    } else {
      this.columnGroups = [
        {
          name: "default",
          columns: this.columns.map((c) => (typeof c === "string" ? c : c.id)),
        },
      ];
      this.defaultColumnGroup = "default";
      this.mobileColumnGroup = "default";
    }
  }

  private loadUrlParams(parameters?: Params) {
    const params = parameters || this.activatedRoute.snapshot.queryParams;
    if (params["view"]) {
      this.displayColumnGroupByName(params["view"]);
    }
    this.filterSelections.forEach((f) => {
      if (params.hasOwnProperty(f.filterSettings.name)) {
        f.selectedOption = params[f.filterSettings.name];
      }
    });
    this.applyFilterSelections();
    if (params["search"]) {
      this.applyFilter(params["search"]);
    }
  }

  columnGroupClick(columnGroupName: string) {
    this.displayColumnGroupByName(columnGroupName);
    this.updateUrl("view", columnGroupName);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.entityTable.recordsDataSource.filter = filterValue;

    this.analyticsService.eventTrack("list_filter_freetext", {
      category: this.entityConstructor?.ENTITY_TYPE,
    });
  }

  filterOptionSelected(
    filter: FilterComponentSettings<T>,
    selectedOption: string
  ) {
    filter.selectedOption = selectedOption;
    this.applyFilterSelections();
    this.updateUrl(filter.filterSettings.name, selectedOption);
  }

  private applyFilterSelections() {
    let filteredData = this.allEntities;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(
        f.filterSettings.getFilterFunction(f.selectedOption)
      );
    });

    this.filteredEntities = filteredData;
  }

  private updateUrl(key: string, value: string) {
    const params = {};
    params[key] = value;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      queryParamsHandling: "merge",
    });
  }

  private async initFilterSelections(): Promise<void> {
    this.filterSelections = await this.filterGeneratorService.generate(
      this.filtersConfig,
      this.entityConstructor,
      this.allEntities
    );
  }

  private displayColumnGroupByName(columnGroupName: string) {
    const selectedColumnIndex = this.columnGroups.findIndex(
      (c) => c.name === columnGroupName
    );
    if (selectedColumnIndex !== -1) {
      this.selectedColumnGroupIndex = selectedColumnIndex;
    }
  }

  getNewRecordFactory(): () => T {
    return () => new this.entityConstructor();
  }

  openFilterOverlay() {
    this.dialog.open(FilterOverlayComponent, {
      data: {
        filterSelections: this.filterSelections,
        filterChangeCallback: (
          filter: FilterComponentSettings<T>,
          option: string
        ) => {
          this.filterOptionSelected(filter, option);
        },
      },
    });
  }
}
