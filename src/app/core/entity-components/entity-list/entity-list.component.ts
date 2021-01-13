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
import { MatSort } from "@angular/material/sort";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { ActivatedRoute, Router } from "@angular/router";
import {
  BooleanFilterConfig,
  ColumnConfig,
  ConfigurableEnumFilterConfig,
  EntityListConfig,
  FilterConfig,
  PrebuiltFilterConfig,
} from "./EntityListConfig";
import { Entity } from "../../entity/entity";
import {
  FilterSelection,
  FilterSelectionOption,
} from "../../filter/filter-selection/filter-selection";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { SessionService } from "../../session/session-service/session.service";
import { User } from "../../user/user";
import { getUrlWithoutParams } from "../../../utils/utils";
import { ConfigService } from "../../config/config.service";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../../configurable-enum/configurable-enum.interface";
import { LoggingService } from "../../logging/logging.service";

export interface ColumnGroup {
  name: string;
  columns: string[];
}

interface FilterComponentSettings<T> {
  filterSettings: FilterSelection<T>;
  selectedOption?: string;
  display?: string;
}

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
  implements OnChanges, OnInit, AfterViewInit {
  @Input() entityList: T[] = [];
  @Input() listConfig: EntityListConfig;
  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  listName = "";
  columns: ColumnConfig[] = [];
  columnGroups: ColumnGroup[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  filtersConfig: FilterConfig[] = [];

  ready = true;
  columnsToDisplay: string[] = [];
  selectedColumnGroup: string = "";

  filterSelections: FilterComponentSettings<T>[] = [];
  entityDataSource = new MatTableDataSource<T>();

  user: User;
  paginatorPageSize = 10;
  paginatorPageIndex = 0;

  filterString = "";

  // This key is used to save the pagination settings on the user entity
  readonly paginatorKey: string;

  constructor(
    private configService: ConfigService,
    private loggingService: LoggingService,
    private sessionService: SessionService,
    private media: MediaObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private entityMapperService: EntityMapperService
  ) {
    this.paginatorKey = getUrlWithoutParams(this.router);
  }

  ngOnInit() {
    this.media.asObservable().subscribe((change: MediaChange[]) => {
      switch (change[0].mqAlias) {
        case "xs":
        case "sm": {
          this.displayColumnGroup(this.mobileColumnGroup);
          break;
        }
        case "md": {
          this.displayColumnGroup(this.defaultColumnGroup);
          break;
        }
        case "lg":
        case "xl": {
          break;
        }
      }
    });
    this.user = this.sessionService.getCurrentUser();
    // Use URl as key to save pagination settings
    this.paginatorPageSize =
      this.user.paginatorSettingsPageSize[this.paginatorKey] ||
      this.paginatorPageSize;
    this.paginatorPageIndex =
      this.user.paginatorSettingsPageIndex[this.paginatorKey] ||
      this.paginatorPageIndex;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("listConfig")) {
      this.listName = this.listConfig.title;
      this.columns = this.listConfig.columns;
      this.columnGroups = this.listConfig.columnGroup.groups;
      this.defaultColumnGroup = this.listConfig.columnGroup.default;
      this.mobileColumnGroup = this.listConfig.columnGroup.mobile;
      this.filtersConfig = this.listConfig.filters;
      this.displayColumnGroup(this.defaultColumnGroup);
    }
    if (changes.hasOwnProperty("entityList")) {
      this.initFilterSelections();
    }
    this.loadUrlParams();
  }

  ngAfterViewInit() {
    this.entityDataSource.sort = this.sort;
    this.entityDataSource.paginator = this.paginator;
    setTimeout(() => {
      this.paginator.pageIndex = this.paginatorPageIndex;
      this.paginator.page.next({
        pageIndex: this.paginator.pageIndex,
        pageSize: this.paginator.pageSize,
        length: this.paginator.length,
      });
    });
  }

  onPaginateChange(event: PageEvent) {
    this.paginatorPageSize = event.pageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.updateUserPaginationSettings();
  }

  columnGroupClick(columnGroupName: string) {
    this.displayColumnGroup(columnGroupName);
    this.updateUrl("view", columnGroupName);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.entityDataSource.filter = filterValue;
  }

  onFilterOptionSelected(
    filter: FilterComponentSettings<T>,
    selectedOption: string
  ) {
    filter.selectedOption = selectedOption;
    this.applyFilterSelections();
    this.updateUrl(filter.filterSettings.name, selectedOption);
  }

  private updateUserPaginationSettings() {
    // The PageSize is stored in the database, the PageList is only in memory
    const hasChangesToBeSaved =
      this.paginatorPageSize !==
      this.user.paginatorSettingsPageSize[this.paginatorKey];

    this.user.paginatorSettingsPageIndex[
      this.paginatorKey
    ] = this.paginatorPageIndex;
    this.user.paginatorSettingsPageSize[
      this.paginatorKey
    ] = this.paginatorPageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }

  private loadUrlParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params["view"]) {
        this.displayColumnGroup(params["view"]);
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
    });
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

  private applyFilterSelections() {
    let filteredData = this.entityList;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(
        f.filterSettings.getFilterFunction(f.selectedOption)
      );
    });

    this.entityDataSource.data = filteredData;
  }

  private initFilterSelections() {
    const filterSelections = [];

    for (const filter of this.filtersConfig) {
      const fs: FilterComponentSettings<T> = {
        filterSettings: new FilterSelection(filter.id, []),
        display: filter.display,
      };
      fs.filterSettings.options = this.initFilterOptions(filter);
      fs.selectedOption = filter.hasOwnProperty("default")
        ? filter.default
        : fs.filterSettings.options[0].key;
      filterSelections.push(fs);
    }

    this.filterSelections = filterSelections;
  }

  private initFilterOptions(config: FilterConfig): FilterSelectionOption<T>[] {
    switch (config.type) {
      case "boolean":
        return this.createBooleanFilterOptions(config as BooleanFilterConfig);
      case "prebuilt":
        return (config as PrebuiltFilterConfig<T>).options;
      case "configurable-enum":
        return this.createConfigurableEnumFilterOptions(
          config as ConfigurableEnumFilterConfig<T>
        );
      default: {
        const options = [...new Set(this.entityList.map((c) => c[config.id]))];
        return FilterSelection.generateOptions(options, config.id);
      }
    }
  }

  private createBooleanFilterOptions(
    filter: BooleanFilterConfig
  ): FilterSelectionOption<T>[] {
    return [
      {
        key: "true",
        label: filter.true,
        filterFun: (c: Entity) => c[filter.id],
      },
      {
        key: "false",
        label: filter.false,
        filterFun: (c: Entity) => !c[filter.id],
      },
      { key: "", label: filter.all, filterFun: () => true },
    ];
  }

  private createConfigurableEnumFilterOptions(
    config: ConfigurableEnumFilterConfig<T>
  ) {
    const options = [{ key: "*", label: "All", filterFun: (e: T) => true }];

    const enumValues = this.configService.getConfig<ConfigurableEnumConfig>(
      CONFIGURABLE_ENUM_CONFIG_PREFIX + config.enumId
    );
    if (!enumValues) {
      this.loggingService.warn(
        "Could not load enum options for filter from config: " + config.id
      );
      return options;
    }

    for (const enumValue of enumValues) {
      options.push({
        key: enumValue.id,
        label: enumValue.label,
        filterFun: (entity) => entity[config.id].id === enumValue.id,
      });
    }

    return options;
  }

  private displayColumnGroup(columnGroupName: string) {
    const selectedColumns = this.columnGroups.find(
      (c) => c.name === columnGroupName
    )?.columns;
    if (selectedColumns) {
      this.columnsToDisplay = selectedColumns;
      this.selectedColumnGroup = columnGroupName;
    }
  }
}
