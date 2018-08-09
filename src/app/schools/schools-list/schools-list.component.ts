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
  schoolList: School[];
  schoolDataSource: MatTableDataSource<School>;

  columnsToDisplay: ['name', 'address', 'medium'];

  constructor(private schoolService: SchoolsServices,
              private router: Router
  ) {
    this.schoolService.getSchools().subscribe(data => {
      this.schoolList = data;
      this.schoolDataSource = new MatTableDataSource<School>(data);
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  showSchoolDetails(school: School) {
    this.router.navigate(['/school', school.getId()]);
  }
}
