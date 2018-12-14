import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {School} from '../school';
import {SchoolsService} from '../schools.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import uniqid from 'uniqid';
import {AlertService} from '../../alerts/alert.service';
import {MatSnackBar, MatTableDataSource} from '@angular/material';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {Child} from '../../children/child';
import {ChildSchoolRelation} from '../../children/childSchoolRelation';

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
    private ss: SchoolsService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(FormBuilder) public fb: FormBuilder,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService
  ) { }

  ngOnInit() {
    // this.entityMapperService.loadType<Child>(Child)
    //   .then(children => children.forEach(child => {
    //     const relation: ChildSchoolRelation = new ChildSchoolRelation(uniqid());
    //     relation.childId = child.getId();
    //     relation.schoolId = this.school.getId();
    //     this.entityMapperService.save<ChildSchoolRelation>(relation)
    //       .then(r => console.log('relation', r));
    //     const id = this.route.snapshot.params['id'];
    //     if (id === 'new') {
    //       this.creatingNew = true;
    //       this.editing = true;
    //       this.school = new School(uniqid());
    //     } else {
    //       this.loadSchool(id);
    //     }
    //     this.initializeForm();
    //   }
    // ));
    const id = this.route.snapshot.params['id'];
    if (id === 'new') {
      this.creatingNew = true;
      this.editing = true;
      this.school = new School(uniqid());
    } else {
      this.loadSchool(id);
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

  loadSchool(id: string) {
    // this.entityMapperService.load(School, id)
    //   .then(loadedEntities => this.school = loadedEntities)
    //   .then(() => this.entityMapperService.loadType<ChildSchoolRelation>(ChildSchoolRelation))
    //   .then(childSchoolRelations => childSchoolRelations.filter(relation => relation.schoolId === this.school.getId()))
    //   .then(childSchoolRelations =>
    //     childSchoolRelations.forEach(relation =>
    //       this.entityMapperService.load<Child>(Child, relation.childId)
    //         .then(child => {
    //           console.log('child', child);
    //           this.studentDataSource.data.push(child)
    //         }))
    //   ).catch((err) => {
    //     console.log('Error', err);
    //     this.alertService.addDanger('Could not load school with id "' + id + '": ' + err)
    // });
    this.entityMapperService.load<School>(School, id)
      .then(schools => this.school = schools)
      .then(() => this.entityMapperService.loadType<Child>(Child))
      .then(children => {
        console.log('children', children);
        return children.filter(child => {
          console.log('child', child.schoolId, this.school.getId(), child.schoolId === this.school.getId());
          return child.schoolId === this.school.getId();
        })
      })
      .then(children => {
        console.log('filtered', children);
        this.studentDataSource.data = children;
        console.log('dataSource', this.studentDataSource.data);
      });
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
    // this.school.name = this.form.get('name').value;
    // this.school.address = this.form.get('address').value;
    // this.school.medium = this.form.get('medium').value;
    // this.school.schoolTiming = this.form.get('schoolTiming').value;
    // this.school.maxClass = this.form.get('maxClass').value;
    // this.school.remarks = this.form.get('remarks').value;
    // this.school.board = this.form.get('board').value;
    // this.school.workDays = this.form.get('workDays').value;
    // this.school.website = this.form.get('website').value;
    // this.school.privateSchool = this.form.get('privateSchool').value;
    //
    // this.entityMapperService.save<School>(this.school)
    //   .then(() => {
    //     if (this.creatingNew) {
    //       this.router.navigate(['/school', this.school.getId()]);
    //     }
    //     this.disableEdit();
    //   })
    //   .catch((err) => this.alertService.addDanger('Could not save School "' + this.school.name + '": ' + err));  }
  }
}
