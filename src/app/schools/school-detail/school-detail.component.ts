import {AfterViewInit, Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../schoolsShared/school';
import {SchoolsServices} from '../schoolsShared/schools.services';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import uniqid from 'uniqid';

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent implements OnInit, AfterViewInit {
  school: School = new School('');

  form: FormGroup;
  creatingNew = false;
  editing = false;

  createNewSchool() {
    var newSchool = new School(uniqid());

    newSchool.name = "Some Indian School";
    newSchool.address = "Das erste Haus rechts";

  }

  initializeForm() {
    this.form = this.fb.group({
      name:         [{value: this.school.name,         disabled: !this.editing}]
    });
  }

  constructor(
    private ss: SchoolsServices,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(FormBuilder) public fb: FormBuilder,
    private entityMapperService: EntityMapperService
  ) {
    this.createNewSchool();

    /**const id = this.route.snapshot.params['id'];
    if (id === 'new') {
      this.creatingNew = true;
      this.editing = true;
      this.school = new School(uniqid());
    } else {
      this.entityMapperService.load<School>(School, id)
        .then(school => {
          this.school = school;
          this.initializeForm();
        });
    }

    this.initializeForm();**/
  }






  studentDataSource = new MatTableDataSource();
  displayedColumns = ['id', 'name', 'age'];
  @ViewChild(MatSort) sort: MatSort;

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
        this.school.name="Indian Shool";
        this.school.address="4. Haus rechts an der Strasse";
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
