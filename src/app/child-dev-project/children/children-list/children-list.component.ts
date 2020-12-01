import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Child } from "../model/child";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { ChildrenService } from "../children.service";
import { AttendanceMonth } from "../../attendance/model/attendance-month";
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

/**
 * 1. Config laden (constructor)
 * 2. Daten komplett laden (ngOnInit)
 * 3. dynamische Filter (z.B. aller verfügbarer Center) berechnen
 * 4. Filter-Auswahl aus URL laden | oder Default-Wert setzen
 * 5. Daten filtern
 *
 * -- User-Interaktion --
 * 1. Daten filtern
 * 2. URL anpassen
 */

/**
 * 1. Config laden (childlist)
 * 2.  config an filterComponent als | async
 * 3. Daten komplett laden (childlist)
 * 4.  daten an filterComponent als | async
 *    5. filterComponent filter berechnen/laden
 *    6. filterComponent triggert output (filterChanged)
 * 7. URL anpassen (childList?)
 * 8. change event abonnieren und Daten filtern
 */

@UntilDestroy()
@Component({
  selector: "app-children-list",
  templateUrl: "./children-list.component.html",
  styleUrls: ["./children-list.component.scss"],
})
export class ChildrenListComponent implements OnInit, AfterViewInit {
  childrenList: Child[] = [];
  attendanceList = new Map<string, AttendanceMonth[]>();
  childrenDataSource = new MatTableDataSource();

  listName: String;

  centerFS = new FilterSelection("center", []);
  filterSelections = [];
  defaultSelectedFilter = {};

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  columnGroupSelection: string;
  columnGroupSmallDisplay: string;
  columnGroupSelectionNotSmallDisplay: string;
  columnGroups: ColumnGroup[];
  columnsToDisplay = ["projectNumber", "name"];
  filterString = "";

  public paginatorPageSize: number;
  public paginatorPageIndex: number;
  private user: User;

  /** dynamically calculated number of attendance blocks displayed in a column to avoid overlap */
  maxAttendanceBlocks: number = 3;
  @ViewChild("attendanceSchoolCell") schoolCell: ElementRef;
  @ViewChild("attendanceCoachingCell") coachingCell: ElementRef;

  constructor(
    private childrenService: ChildrenService,
    private router: Router,
    private route: ActivatedRoute,
    private media: MediaObserver,
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService
  ) {
    this.loadConfig();
  }

  ngOnInit() {
    this.loadData();
    this.user = this.sessionService.getCurrentUser();
    this.paginatorPageSize = this.user.paginatorSettingsPageSize.childrenList;
    this.paginatorPageIndex = this.user.paginatorSettingsPageIndex.childrenList;
    this.media.media$
      .pipe(untilDestroyed(this))
      .subscribe((change: MediaChange) => {
        switch (change.mqAlias) {
          case "xs":
          case "sm": {
            if (this.columnGroupSmallDisplay) {
              this.displayColumnGroup(this.columnGroupSmallDisplay);
            }
            this.maxAttendanceBlocks = 1;
            break;
          }
          case "md": {
            this.displayColumnGroup(this.columnGroupSelectionNotSmallDisplay);
            this.maxAttendanceBlocks = 2;
            break;
          }
          case "lg": {
            this.maxAttendanceBlocks = 3;
            break;
          }
          case "xl": {
            this.maxAttendanceBlocks = 6;
            break;
          }
        }
      });
  }

  private loadConfig() {
    this.route.data.subscribe((config) => {
      this.listName = config.title;
      this.columnGroups = config.columnGroups;
      if (config.defaultColumnGroup) {
        this.columnGroupSelection = config.defaultColumnGroup;
      } else {
        this.columnGroupSelection = config.columnGroups[0].name;
      }
      this.columnGroupSmallDisplay = config.columnGroupSmallDisplay;
    });
  }

  private loadUrlParams(replaceUrl: boolean = false) {
    this.route.queryParams.subscribe((params) => {
      this.columnGroupSelection = params["view"]
        ? params["view"]
        : this.columnGroupSelection;
      this.displayColumnGroup(this.columnGroupSelection);

      this.filterSelections.forEach((f) => {
        f.selectedOption = params[f.name];
        if (f.selectedOption === undefined && f.options.length > 0) {
          f.selectedOption = f.options[0].key;
          if (this.defaultSelectedFilter.hasOwnProperty(f.name)) {
            const defFilter = this.defaultSelectedFilter[f.name].toLowerCase();
            for (const filterOption of f.options) {
              if (filterOption.key === defFilter) {
                f.selectedOption = defFilter;
              }
            }
          }
        }
      });
      this.applyFilterSelections(replaceUrl);
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
    const hasChangesToBeSaved =
      this.paginatorPageSize !==
      this.user.paginatorSettingsPageSize.childrenList;

    this.user.paginatorSettingsPageIndex.childrenList = this.paginatorPageIndex;
    this.user.paginatorSettingsPageSize.childrenList = this.paginatorPageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }

  private loadData(replaceUrl: boolean = false) {
    this.childrenService
      .getChildren()
      .pipe(untilDestroyed(this))
      .subscribe((children) => {
        this.childrenList = children;
        this.addFilterSelections();
        this.applyFilterSelections(replaceUrl);
        this.updateUrl();
      });
    this.childrenService
      .getAttendances()
      .pipe(untilDestroyed(this))
      .subscribe((results) => this.prepareAttendanceData(results));
  }
  /*
  private initCenterFilterOptions(centersWithProbability: string[]) {
    const options = [{key: '', label: 'All', filterFun: (c: Child) => true}];

    centersWithProbability.forEach(center => {
      options.push({key: center.toLowerCase(), label: center, filterFun: (c: Child) => c.center === center});
    });

    this.centerFS.options = options;
  } */

  prepareAttendanceData(loadedEntities: AttendanceMonth[]) {
    this.attendanceList = new Map<string, AttendanceMonth[]>();
    loadedEntities.forEach((x) => {
      if (!this.attendanceList.has(x.student)) {
        this.attendanceList.set(x.student, new Array<AttendanceMonth>());
      }
      this.attendanceList.get(x.student).push(x);
    });

    this.attendanceList.forEach((studentsAttendance) => {
      studentsAttendance.sort((a, b) => {
        // descending by date
        if (a.month > b.month) {
          return -1;
        }
        if (a.month < b.month) {
          return 1;
        }
        return 0;
      });
    });
  }

  applySearchTerm(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.childrenDataSource.filter = filterValue;
  }

  displayColumnGroup(columnGroupName: string) {
    this.columnGroupSelection = columnGroupName;
    if (columnGroupName !== this.columnGroupSmallDisplay) {
      this.columnGroupSelectionNotSmallDisplay = columnGroupName;
    }
    let found = false;
    let group: ColumnGroup;
    let i = 0;
    while (!found && i < this.columnGroups.length) {
      if (this.columnGroups[i].name === columnGroupName) {
        found = true;
        group = this.columnGroups[i];
      }
      i++;
    }
    this.columnsToDisplay = group.columns;
    this.updateUrl();
  }

  updateUrl(replaceUrl: boolean = false) {
    const params = {};
    this.filterSelections.forEach((f) => {
      params[f.name] = f.selectedOption;
    });

    params["view"] = this.columnGroupSelection;

    this.router.navigate(["child"], {
      queryParams: params,
      replaceUrl: replaceUrl,
    });
  }

  filterClicked(filterSelection, selectedOption: string) {
    filterSelection.selectedOption = selectedOption;
    this.applyFilterSelections();
    this.updateUrl();
  }

  applyFilterSelections(replaceUrl: boolean = false) {
    let filteredData = this.childrenList;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.childrenDataSource.data = filteredData;
  }

  private addFilterSelections() {
    this.route.data.subscribe((config) => {
      this.filterSelections = [];
      config.filters.forEach((filter) => {
        const filterSelection = new FilterSelection(filter.id, []);
        if (filter.id === "status") {
          filterSelection.options = [
            {
              key: "",
              label: filter.filterEntries.all,
              filterFun: () => true,
            },
            {
              key: "active",
              label: filter.filterEntries.active,
              filterFun: (c: Child) => c.isActive(),
            },
            {
              key: "dropout",
              label: filter.filterEntries.inactive,
              filterFun: (c: Child) => !c.isActive(),
            },
          ];
          filterSelection.selectedOption = filter.default;
        } else {
          const options = this.childrenList
            .map((c) => c[filter.id])
            .filter(
              (value, index, arr) => value && arr.indexOf(value) === index
            );
          filterSelection.initOptions(options, filter.id);
        }
        if (filter.default) {
          this.defaultSelectedFilter[filter.id] = filter.default;
        } else {
          this.defaultSelectedFilter[filter.id] =
            filterSelection.options[0].key;
        }
        this.filterSelections.push(filterSelection);
      });
    });
  }
}
