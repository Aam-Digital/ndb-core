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
import { MatSort } from "@angular/material/sort";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Entity } from "../../entity/entity";
import { MatTableDataSource } from "@angular/material/table";
import {
  FilterSelection,
  FilterSelectionOption,
} from "../../filter/filter-selection/filter-selection";
import { User } from "../../user/user";
import { SessionService } from "../../session/session-service/session.service";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityMapperService } from "../../entity/entity-mapper.service";

export interface ColumnGroup {
  name: string;
  columns: string[];
}

@Component({
  selector: "app-entity-list",
  templateUrl: "./entity-list.component.html",
  styleUrls: ["./entity-list.component.scss"],
})
export class EntityListComponent<T extends Entity>
  implements OnChanges, AfterViewInit {
  @Input() entityList: T[] = [];
  @Input() listConfig: any = {};
  // This name is used to store the pagination settings in the user entity
  @Input() componentName: string = "";
  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  listName = "";
  columns: any[] = [];
  columnGroups: ColumnGroup[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  filtersConfig: any[] = [];

  ready = true;
  columnsToDisplay: any[] = [];
  selectedColumnGroup: string = "";

  filterSelections: FilterSelection<T>[] = [];
  filterDropdowns: FilterSelection<T>[] = [];
  entityDataSource = new MatTableDataSource<T>();

  user: User;
  public paginatorPageSize = 10;
  public paginatorPageIndex = 0;

  filterString = "";

  constructor(
    private sessionService: SessionService,
    private media: MediaObserver,
    private router: Router,
    private route: ActivatedRoute,
    private entityMapperService: EntityMapperService
  ) {
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("componentName")) {
      this.user = this.sessionService.getCurrentUser();
      this.paginatorPageSize =
        this.user.paginatorSettingsPageSize[this.componentName] ||
        this.paginatorPageSize;
      this.paginatorPageIndex =
        this.user.paginatorSettingsPageIndex[this.componentName] ||
        this.paginatorPageIndex;
    }
    if (changes.hasOwnProperty("listConfig")) {
      this.listName = this.listConfig.title;
      this.columns = this.listConfig.columns;
      this.columnGroups = this.listConfig.columnGroups.groups;
      this.defaultColumnGroup = this.listConfig.columnGroups.default;
      this.mobileColumnGroup = this.listConfig.columnGroups.mobile;
      this.filtersConfig = this.listConfig.filters;
      this.displayColumnGroup(this.defaultColumnGroup);
    }
    if (changes.hasOwnProperty("entityList")) {
      this.addFilterSelections();
      this.applyFilterSelections();
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

  filterClick(filter: FilterSelection<any>, selectedOption) {
    filter.selectedOption = selectedOption;
    this.applyFilterSelections();
    this.updateUrl(filter.name, selectedOption);
  }

  private updateUserPaginationSettings() {
    // The PageSize is stored in the database, the PageList is only in memory
    const hasChangesToBeSaved =
      this.paginatorPageSize !==
      this.user.paginatorSettingsPageSize[this.componentName];

    this.user.paginatorSettingsPageIndex[
      this.componentName
    ] = this.paginatorPageIndex;
    this.user.paginatorSettingsPageSize[
      this.componentName
    ] = this.paginatorPageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }

  private loadUrlParams() {
    this.route.queryParams.subscribe((params) => {
      if (params["view"]) {
        this.displayColumnGroup(params["view"]);
      }
      this.filterSelections.forEach((f) => {
        if (params.hasOwnProperty(f.name)) {
          f.selectedOption = params[f.name];
        }
      });
      this.applyFilterSelections();
    });
  }

  private updateUrl(key: string, value: string) {
    const params = {};
    params[key] = value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: "merge",
    });
  }

  private applyFilterSelections() {
    let filteredData = this.entityList;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });
    this.filterDropdowns.forEach((f) => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.entityDataSource.data = filteredData;
  }

  private addFilterSelections() {
    this.filterSelections = [];
    this.filterDropdowns = [];
    this.filtersConfig.forEach((filter) => {
      const fs = new FilterSelection(filter.id, []);
      this.initFilterOptions(fs, filter);
      fs.selectedOption = filter.hasOwnProperty("default")
        ? filter.default
        : fs.options[0].key;
      if (filter.display === "dropdown") {
        this.filterDropdowns.push(fs);
      } else {
        this.filterSelections.push(fs);
      }
    });
  }

  private initFilterOptions(filter, config): FilterSelectionOption<T>[] {
    switch (config.type) {
      case "boolean":
        return (filter.options = this.createBooleanFilterOptions(config));
      case "prebuilt":
        return (filter.options = config.options);
      default: {
        const options = [...new Set(this.entityList.map((c) => c[config.id]))];
        filter.initOptions(options, config.id);
      }
    }
  }

  private createBooleanFilterOptions(filter): FilterSelectionOption<any>[] {
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

  private displayColumnGroup(columnGroupName: string) {
    // When components, that are used in the list (app-list-attendance), also listen to the mediaObserver, a new
    // mediaChange is created once this used component is displayed (through column groups change). This may
    // re-trigger the settings for small screens. Therefore, we only allow a change ever 0.5 seconds to prevent this.
    if (this.ready) {
      this.ready = false;
      setTimeout(() => (this.ready = true), 500);
      this.columnsToDisplay = this.columnGroups.find(
        (c) => c.name === columnGroupName
      ).columns;
      this.selectedColumnGroup = columnGroupName;
    }
  }
}
