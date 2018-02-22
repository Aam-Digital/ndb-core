import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatTableDataSource, MatSort } from '@angular/material';
import { School } from "../../schoolsShared/school";
import { SchoolsServices } from "../../schoolsShared/schools.services";
import { Router } from "@angular/router";

@Component({
  selector: 'app-schools',
  templateUrl: './schools-list.component.html',
  styleUrls: ['./schools-list.component.css']
})
export class SchoolsListComponent implements OnInit {
  schools: School[];
  school: School;

  @Output() showDetailsEvent = new EventEmitter<School>();

  displayedColumns = ['id', 'name', 'location'];
  constructor(
    private ss: SchoolsServices,
    private router: Router
  ) {}

  dataSource = new MatTableDataSource();

  ngOnInit() {
    this.dataSource.data = this.ss.getAll();
  }

  @ViewChild(MatSort) sort: MatSort;        //Sorting

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {        //Filtering
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  showDetails(id) {                         //Routing to schools details
    let route: string;
    route =this.router.url + '/' + id;
    this.router.navigate([route]);
  }
}
