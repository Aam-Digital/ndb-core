import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatSort } from "@angular/material";
import { School } from "../../schoolsShared/school";
import { SchoolsServices } from "../../schoolsShared/schools.services";

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent implements OnInit {
  school: School;
  displayedColumns = ['id', 'name', 'age'];
  dataSource = new MatTableDataSource();      //Table with student

  constructor(
    private ss: SchoolsServices,
    private route: ActivatedRoute,
  ) { }

  //Get school via id in url
  ngOnInit() {
    const params = this.route.snapshot.params;
    this.school = this.ss.getSingle(parseInt(params['id']));
    this.dataSource.data = this.school.students;
  }

  //Logic for filter- and sorting

  @ViewChild(MatSort) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
