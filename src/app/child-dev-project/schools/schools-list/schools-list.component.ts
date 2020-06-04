import { Component, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { School } from "../model/school";
import { SchoolsService } from "../schools.service";
import { Router } from "@angular/router";
import { FilterSelection } from "../../../core/filter/filter-selection/filter-selection";
import { MatPaginator } from "@angular/material/paginator";

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

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  filterString = "";
  columnsToDisplay: string[] = [
    "name",
    "medium",
    "privateSchool",
    "academicBoard",
    "upToClass",
  ];

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

  constructor(private schoolService: SchoolsService, private router: Router) {}

  ngOnInit() {
    this.schoolService.getSchools().subscribe((data) => {
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
