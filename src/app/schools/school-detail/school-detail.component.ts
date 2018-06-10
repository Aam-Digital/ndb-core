import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../schoolsShared/school';
import {SchoolsServices} from '../schoolsShared/schools.services';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent implements OnInit, AfterViewInit {
  school: School;

  studentDataSource = new MatTableDataSource();
  displayedColumns = ['id', 'name', 'age'];
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private ss: SchoolsServices,
    private route: ActivatedRoute,
    private router: Router,
    private entityMapperService: EntityMapperService
  ) { }

  ngOnInit() {
    const params = this.route.snapshot.params;
    //this.school = this.ss.getSingle(parseInt(params['id'], 10));
    /*this.entityMapperService.load<School>(School, params['id'])
      .then(school => this.school=school)
      .catch(err => {
        console.log("Errorcought");
        */
        this.school.id="4"
        //this.studentDataSource.data = this.school.students;
        this.school.name="test";
        this.school.address="testtesttest";
        this.school.max_class=3;
        this.school.medium="hindu";

      
    
  }
  ngAfterViewInit() {
    this.studentDataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.studentDataSource.filter = filterValue;
  }

  studentClick(id: number) {
    let route: string;
    route = '/child/' + id;
    this.router.navigate([route]);
  }
}