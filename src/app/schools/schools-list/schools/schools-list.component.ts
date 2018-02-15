import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { MatTableDataSource, MatSort } from '@angular/material';
import { School } from "../../schoolsShared/school";
import { Student } from "../../schoolsShared/students";
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
    this.school = this.ss.getSingle(1);
  }

  showDetails(id) {
    let route: string;
    route =this.router.url + '/' + id;
    console.log(route);
    this.router.navigate([route]);
  }
}
