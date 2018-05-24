import {Component, OnInit, Output, EventEmitter, ViewChild, AfterViewInit} from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../schoolsShared/school';
import {SchoolsServices} from '../schoolsShared/schools.services';
import {Router} from '@angular/router';

@Component({
  selector: 'app-schools',
  templateUrl: './schools-list.component.html',
  styleUrls: ['./schools-list.component.css']
})
export class SchoolsListComponent implements OnInit, AfterViewInit {
  schools: School[];
  school: School;

  dataSource = new MatTableDataSource();
  displayedColumns = ['id', 'name', 'address', 'medium'];
  @ViewChild(MatSort) sort: MatSort;
  @Output() showDetailsEvent = new EventEmitter<School>();

  constructor(
    private ss: SchoolsServices,
    private router: Router
  ) {}

  ngOnInit() {
    this.dataSource.data = this.ss.schools;
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  showDetails(id) {
    let route: string;
    route = this.router.url + '/' + id;
    this.router.navigate([route]);
  }
}
