import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {School} from '../school';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import uniqid from 'uniqid';
import {AlertService} from '../../alerts/alert.service';
import {MatSnackBar, MatTableDataSource} from '@angular/material';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {Child} from '../../children/child';

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent implements OnInit {
  school = new School('');
  studentDataSource: MatTableDataSource<Child> = new MatTableDataSource();
  displayedColumns = ['id', 'name', 'age'];


  form: FormGroup;
  creatingNew = false;
  editing = false;

  initializeForm() {
    this.form = this.fb.group({
      name:           [{value: this.school.name,          disabled: !this.editing}],
      address:        [{value: this.school.address,       disabled: !this.editing}],
      medium:         [{value: this.school.medium,        disabled: !this.editing}],
      schoolTiming:   [{value: this.school.schoolTiming,  disabled: !this.editing}],
      maxClass:       [{value: this.school.maxClass,      disabled: !this.editing}],
      remarks:        [{value: this.school.remarks,       disabled: !this.editing}],
      board:          [{value: this.school.board,         disabled: !this.editing}],
      workDays:       [{value: this.school.workDays,      disabled: !this.editing}],
      website:        [{value: this.school.website,       disabled: !this.editing}],
      privateSchool:  [{value: this.school.privateSchool, disabled: !this.editing}]
    });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(FormBuilder) public fb: FormBuilder,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService,
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id === 'new') {
      this.creatingNew = true;
      this.editing = true;
      this.school = new School(uniqid());
    } else {
      this.studentDataSource.data = [];
      this.loadSchool(id);
    }
    this.initializeForm();
  }

  switchEdit() {
    this.editing = !this.editing;
    this.initializeForm();
  }

  async loadSchool(id: string) {
    this.entityMapperService.load(School, id)
      .then((school: School) => {
        this.school = school;
        this.school.getStudents(this.entityMapperService)
          .then((students: Child[]) => {
            this.studentDataSource.data = students;
            this.initializeForm();
          });
      })
  }

  removeSchool() {
    const dialogRef = this.confirmationDialog
      .openDialog('Delete?', 'Are you sure you want to delete this School?');

    dialogRef.afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.entityMapperService.remove<School>(this.school)
            .then(() => this.router.navigate(['/school']));

          const snackBarRef = this.snackBar.open('Deleted School "' + this.school.name + '"', 'Undo', {duration: 8000});
          snackBarRef.onAction().subscribe(() => {
            this.entityMapperService.save(this.school, true);
            this.router.navigate(['/school', this.school.getId()]);
          });
        }
      });
  }

  studentClick(id: number) {
    let route: string;
    route = '/child/' + id;
    this.router.navigate([route]);
  }
  saveSchool() {
    this.assignFormValuesToSchool(this.school, this.form);

    this.entityMapperService.save<School>(this.school)
      .then(() => {
        if (this.creatingNew) {
          this.router.navigate(['/school', this.school.getId()]);
          this.creatingNew = false;
        }
        this.switchEdit();
      })
      .catch((err) => this.alertService.addDanger('Could not save School "' + this.school.name + '": ' + err));
  }

  private assignFormValuesToSchool(school: School, form: FormGroup) {
    Object.keys(form.controls).forEach(key => {
      school[key] = form.get(key).value;
    });
  }
}
