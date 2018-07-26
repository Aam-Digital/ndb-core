import {Component, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {School} from '../schoolsShared/school';
import {SchoolsServices} from '../schoolsShared/schools.services';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import uniqid from 'uniqid';
import {AlertService} from '../../alerts/alert.service';
import {MatSnackBar} from '@angular/material';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent {
  school = new School('');

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
    private ss: SchoolsServices,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(FormBuilder) public fb: FormBuilder,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService
  ) {
    const id = this.route.snapshot.params['id'];
    if (id === 'new') {
      this.creatingNew = true;
      this.editing = true;
      this.school = new School(uniqid());
    } else {
      this.entityMapperService.load<School>(School, id)
        .then(school => {
          this.school = school;
          this.initializeForm();
        }).catch((err) => this.alertService.addDanger('Could not load school with id "' + id + '": ' + err));
    }
    this.initializeForm();
  }

  enableEdit() {
    this.editing = true;
    this.initializeForm();
  }

  disableEdit() {
    this.editing = false;
    this.initializeForm();
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

  saveSchool() {
    this.school.name = this.form.get('name').value;
    this.school.address = this.form.get('address').value;
    this.school.medium = this.form.get('medium').value;
    this.school.schoolTiming = this.form.get('schoolTiming').value;
    this.school.maxClass = this.form.get('maxClass').value;
    this.school.remarks = this.form.get('remarks').value;
    this.school.board = this.form.get('board').value;
    this.school.workDays = this.form.get('workDays').value;
    this.school.website = this.form.get('website').value;
    this.school.privateSchool = this.form.get('privateSchool').value;

    this.entityMapperService.save<School>(this.school)
      .then(() => {
        if (this.creatingNew) {
          this.router.navigate(['/school', this.school.getId()]);
        }
        this.disableEdit();
      })
      .catch((err) => this.alertService.addDanger('Could not save School "' + this.school.name + '": ' + err));  }
}
