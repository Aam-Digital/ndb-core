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

  centerFS = new FilterSelection("center", []);
  dropoutFS = new FilterSelection("status", [
    {
      key: "active",
      label: "Current Project Children",
      filterFun: (c: Child) => c.isActive(),
    },
    {
      key: "dropout",
      label: "Dropouts",
      filterFun: (c: Child) => !c.isActive(),
    },
    { key: "", label: "All", filterFun: () => true },
  ]);
  filterSelections = [this.dropoutFS, this.centerFS];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  columnGroupSelection = "School Info";
  columnGroups: ColumnGroup[] = [
    {
      name: "Basic Info",
      columns: [
        "projectNumber",
        "name",
        "age",
        "gender",
        "schoolClass",
        "schoolId",
        "center",
        "status",
      ],
    },
    {
      name: "School Info",
      columns: [
        "projectNumber",
        "name",
        "age",
        "schoolClass",
        "schoolId",
        "school",
        "coaching",
        "motherTongue",
      ],
    },
    {
      name: "Status",
      columns: [
        "projectNumber",
        "name",
        "center",
        "status",
        "admissionDate",
        "has_aadhar",
        "has_kanyashree",
        "has_bankAccount",
        "has_rationCard",
        "has_BplCard",
      ],
    },
    {
      name: "Health",
      columns: [
        "projectNumber",
        "name",
        "center",
        "health_vaccinationStatus",
        "health_bloodGroup",
        "health_eyeHealthStatus",
        "health_lastEyeCheckup",
        "health_lastDentalCheckup",
        "health_lastENTCheckup",
        "health_lastVitaminD",
        "health_lastDeworming",
        "gender",
        "age",
        "dateOfBirth",
      ],
    },
    {
      name: "Mobile",
      columns: ["projectNumber", "name", "age", "schoolId"],
    },
  ];
  columnsToDisplay = ["projectNumber", "name"];
  filterString = "";

  public paginatorPageSize: number;
  public paginatorPageIndex: number;
  private user: User;

  private ready = true;

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
    });
    this.loadData();
    this.loadUrlParams();
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
            this.displayColumnGroup("Mobile");
            break;
          }
          case "md": {
            this.displayColumnGroup("School Info");
            break;
          }
          case "lg": {
            break;
          }
          case "xl": {
            break;
          }
        }
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

  private async loadData(replaceUrl: boolean = false) {
    this.childrenList = await this.entityMapperService.loadType<Child>(Child);
    const centers = this.childrenList
      .map((c) => c.center)
      .filter((value, index, arr) => value && arr.indexOf(value) === index);
    this.centerFS.initOptions(centers, "center");
    this.applyFilterSelections(replaceUrl);
  }

  /*
  private initCenterFilterOptions(centersWithProbability: string[]) {
    const options = [{key: '', label: 'All', filterFun: (c: Child) => true}];

    centersWithProbability.forEach(center => {
      options.push({key: center.toLowerCase(), label: center, filterFun: (c: Child) => c.center === center});
    });

    this.centerFS.options = options;
  } */

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.childrenDataSource.filter = filterValue;
  }

  displayColumnGroup(columnGroupName: string) {
    // When components, that are used in the list (app-list-attendance), also listen to the mediaObserver, a new
    // mediaChange is created once this used component is displayed (through column groups change). This may
    // re-trigger the settings for small screens. Therefore, we only allow a change ever 0.5 seconds to prevent this.
    if (this.ready) {
      this.ready = false;
      setTimeout(() => (this.ready = true), 500);
      this.columnGroupSelection = columnGroupName;
      this.columnsToDisplay = this.columnGroups.find(
        (c) => c.name === columnGroupName
      ).columns;
      this.updateUrl();
    }
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

  applyFilterSelections(replaceUrl: boolean = false) {
    let filteredData = this.childrenList;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.childrenDataSource.data = filteredData;

    this.updateUrl(replaceUrl);
  }
}
