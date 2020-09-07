import { Component, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { School } from "../model/school";
import { SchoolsService } from "../schools.service";
import { Router } from "@angular/router";
import { FilterSelection } from "../../../core/filter/filter-selection/filter-selection";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

@UntilDestroy()
@Component({
  selector: "app-schools-list",
  templateUrl: "./schools-list.component.html",
  styleUrls: ["./schools-list.component.scss"],
})
export class SchoolsListComponent implements OnInit, AfterViewInit {
  schoolList: School[];
  schoolDataSource: MatTableDataSource<School> = new MatTableDataSource<
    School
  >();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  filterString = "";
  columnsToDisplay: string[] = ["name", "privateSchool", "academicBoard"];

  mediumFS = new FilterSelection("medium", []);
  privateFS = new FilterSelection("private", [
    {
      key: "private",
      label: "Private School",
      filterFun: (s: School) => s.privateSchool,
    },
    {
      key: "government",
      label: "Government School",
      filterFun: (s: School) => !s.privateSchool,
    },
    { key: "", label: "All", filterFun: () => true },
  ]);
  filterSelections = [this.mediumFS, this.privateFS];

  public paginatorPageSize: number;
  public paginatorPageIndex: number;
  private user: User;

  constructor(
    private schoolService: SchoolsService,
    private router: Router,
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService
  ) {}

  ngOnInit() {
    this.user = this.sessionService.getCurrentUser();
    this.paginatorPageSize = this.user.paginatorSettingsPageSize.schoolsList;
    this.paginatorPageIndex = this.user.paginatorSettingsPageIndex.schoolsList;
    this.schoolService
      .getSchools()
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        this.schoolList = data;
        this.schoolDataSource.data = data;

        const mediums = data
          .map((s) => s.medium)
          .filter((value, index, arr) => value && arr.indexOf(value) === index);
        this.mediumFS.initOptions(mediums, "medium");
      });
  }

  ngAfterViewInit() {
    this.schoolDataSource.sort = this.sort;
    this.schoolDataSource.paginator = this.paginator;
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
    this.user.paginatorSettingsPageSize.schoolsList = this.paginatorPageSize;
    this.user.paginatorSettingsPageIndex.schoolsList = this.paginatorPageIndex;
    this.entityMapperService.save<User>(this.user);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.schoolDataSource.filter = filterValue;
  }

  applyFilterSelections() {
    let filteredData = this.schoolList;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.schoolDataSource.data = filteredData;
  }

  addSchoolClick() {
    this.router.navigate([this.router.url, "new"]);
  }

  showSchoolDetails(school: School) {
    this.router.navigate([this.router.url, school.getId()]);
  }
}
