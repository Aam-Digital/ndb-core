import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../schoolsShared/school';
import {SchoolsServices} from '../schoolsShared/schools.services';
import {Router} from '@angular/router';

@Component({
  selector: 'app-schools-list',
  templateUrl: './schools-list.component.html',
  styleUrls: ['./schools-list.component.css']
})

export class SchoolsListComponent implements OnInit, AfterViewInit {
  schoolList: School[];
  schoolDataSource: MatTableDataSource<School> = new MatTableDataSource<School>();

  @ViewChild(MatSort) sort: MatSort;
  columnsToDisplay: string[] = ['name', 'address', 'medium', 'privateSchool'];
  mediums: string[];
  mediumFilterSelection = '';
  filterFunctionMedium: (s: School) => boolean = (s: School) => true;

  constructor(private schoolService: SchoolsServices,
              private router: Router
  ) {
    this.schoolService.getSchools().subscribe(data => {
      this.schoolList = data;
      this.schoolDataSource.data = data;
      this.setMediumFilteredList(this.mediumFilterSelection);

      this.mediums = data.map(s => s.medium).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.schoolDataSource.filter = filterValue;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.schoolDataSource.sort = this.sort;
  }

  applyFilterGroups() {
    this.schoolDataSource.data = this.schoolList
      .filter(this.filterFunctionMedium);
  }

  setMediumFilteredList(filteredSelection: string) {
    if (filteredSelection === '') {
      this.filterFunctionMedium = (s: School) => true;
    } else {
      this.filterFunctionMedium = (s: School) => s.medium === filteredSelection;
    }

    this.applyFilterGroups();
  }

  addSchoolClick() {
    let route: string;
    route = this.router.url + '/new';
    this.router.navigate([route]);
  }

  showSchoolDetails(school: School) {
    this.router.navigate(['/school', school.getId()]);
  }
}
