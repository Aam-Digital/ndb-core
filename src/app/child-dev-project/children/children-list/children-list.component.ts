import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { Child } from "../model/child";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { FilterSelection } from "../../../core/filter/filter-selection/filter-selection";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

export interface ColumnGroup {
  name: string;
  columns: string[];
}

@UntilDestroy()
@Component({
  selector: "app-children-list",
  templateUrl: "./children-list.component.html",
  styleUrls: ["./children-list.component.scss"],
})
export class ChildrenListComponent implements OnInit, AfterViewInit {
  childrenList: Child[] = [];
  childrenDataSource = new MatTableDataSource();

  listName: String = "";
  columns: any[] = [];
  filtersConfig: any[] = [];

  filterSelections: FilterSelection<any>[] = [];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  columnGroups: ColumnGroup[] = [];
  selectedColumnGroup: string;
  defaultColumnGroup: string;
  mobileColumnGroup: string;
  columnsToDisplay = [];
  filterString = "";

  public paginatorPageSize: number;
  public paginatorPageIndex: number;
  private user: User;

  ready = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private media: MediaObserver,
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService
  ) {}

  ngOnInit() {
    this.route.data.subscribe((config) => {
      this.listName = config.title;
      this.columns = config.columns;
      this.columnGroups = config.columnGroups.groups;
      this.defaultColumnGroup = config.columnGroups.default;
      this.mobileColumnGroup = config.columnGroups.mobile;
      this.filtersConfig = config.filters;
    });
    this.loadData().then(() => {
      this.displayColumnGroup(this.defaultColumnGroup);
      this.addFilterSelections();
      this.applyFilterSelections();
      this.loadUrlParams();
    });
    this.user = this.sessionService.getCurrentUser();
    this.paginatorPageSize = this.user.paginatorSettingsPageSize.childrenList;
    this.paginatorPageIndex = this.user.paginatorSettingsPageIndex.childrenList;
    this.media
      .asObservable()
      .pipe(untilDestroyed(this))
      .subscribe((change: MediaChange[]) => {
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

  private loadUrlParams() {
    this.route.queryParams.subscribe((params) => {
      if (params["view"]) {
        this.displayColumnGroup(params["view"]);
      }

      this.filterSelections.forEach((f) => {
        f.selectedOption = params[f.name];
        if (f.selectedOption === undefined && f.options.length > 0) {
          f.selectedOption = f.options[0].key;
        }
      });
      this.applyFilterSelections();
    });
  }

  ngAfterViewInit() {
    this.childrenDataSource.sort = this.sort;
    this.childrenDataSource.paginator = this.paginator;
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

  private updateUserPaginationSettings() {
    // The PageSize is stored in the database, the PageList is only in memory
    const hasChangesToBeSaved =
      this.paginatorPageSize !==
      this.user.paginatorSettingsPageSize.childrenList;

    this.user.paginatorSettingsPageIndex.childrenList = this.paginatorPageIndex;
    this.user.paginatorSettingsPageSize.childrenList = this.paginatorPageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }

  private async loadData() {
    this.childrenList = await this.entityMapperService.loadType<Child>(Child);
  }

  columnGroupClick(columnGroupName: string) {
    this.displayColumnGroup(columnGroupName);
    this.updateUrl();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.childrenDataSource.filter = filterValue;
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

  private updateUrl() {
    const params = {};
    this.filterSelections.forEach((f) => {
      params[f.name] = f.selectedOption;
    });

    params["view"] = this.selectedColumnGroup;

    this.router.navigate(["child"], {
      queryParams: params,
      replaceUrl: false,
    });
  }

  private addFilterSelections() {
    this.filterSelections = this.filtersConfig.map((filter) => {
      const fs = new FilterSelection(filter.id, []);
      if (filter.type === "boolean") {
        fs.options = [
          {
            key: "true",
            label: filter.true,
            filterFun: (c: Child) => c[filter.id],
          },
          {
            key: "false",
            label: filter.false,
            filterFun: (c: Child) => !c[filter.id],
          },
          { key: "", label: filter.all, filterFun: () => true },
        ];
      } else {
        const options = [
          ...new Set(this.childrenList.map((c) => c[filter.id])),
        ];
        fs.initOptions(options, filter.id);
      }
      fs.selectedOption = filter.default || fs.options[0].key;
      return fs;
    });
  }

  filterClick(filter: FilterSelection<any>, selectedOption) {
    filter.selectedOption = selectedOption;
    this.applyFilterSelections();
    this.updateUrl();
  }

  private applyFilterSelections() {
    let filteredData = this.childrenList;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.childrenDataSource.data = filteredData;
  }
}
