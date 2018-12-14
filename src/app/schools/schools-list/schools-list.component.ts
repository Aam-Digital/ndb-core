import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../school';
import {SchoolsService} from '../schools.service';
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
  columnsToDisplay: string[] = ['name', 'medium', 'privateSchool', 'academicBoard', 'upToClass'];

  mediums: string[];
  mediumFilterSelection = '';

  privateSchools: string[] = ['Private  School'];
  privateSchoolFilterSelection = '';

  filterFunctionPrivateSchool: (s: School) => boolean = (s: School) => true;
  filterFunctionMedium: (s: School) => boolean = (s: School) => true;

  constructor(private schoolService: SchoolsService,
              private router: Router) {
  }

  ngOnInit() {
    this.schoolService.getSchools().subscribe(data => {
      this.schoolList = data;
      this.schoolDataSource.data = data;
      this.setMediumFilteredList(this.mediumFilterSelection);

      this.mediums = data.map(s => s.medium).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }

  ngAfterViewInit() {
    this.schoolDataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.schoolDataSource.filter = filterValue;
  }

  applyFilterGroups() {
    this.schoolDataSource.data = this.schoolList
      .filter(this.filterFunctionMedium)
      .filter(this.filterFunctionPrivateSchool);
  }

  setMediumFilteredList(filteredSelection: string) {
    if (filteredSelection === '') {
      this.filterFunctionMedium = (s: School) => true;
    } else {
      this.filterFunctionMedium = (s: School) => s.medium === filteredSelection;
    }

    this.applyFilterGroups();
  }

  setPrivateSchoolFilteredList(filteredSelection: string) {
    if (filteredSelection === '') {
      this.filterFunctionPrivateSchool = (s: School) => true;
    } else {
      this.filterFunctionPrivateSchool = (s: School) => s.privateSchool === true;
    }

    this.applyFilterGroups();
  }



  addSchoolClick() {
    this.router.navigate([this.router.url, 'new']);
  }

  showSchoolDetails(school: School) {
    this.router.navigate([this.router.url, school.getId()]);
  }
}
