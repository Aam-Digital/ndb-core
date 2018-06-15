/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Component, Inject} from '@angular/core';
import {Child} from '../child';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Gender} from '../Gender';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';

import uniqid from 'uniqid';
import {AlertService} from '../../alerts/alert.service';


@Component({
  selector: 'app-child-details',
  templateUrl: './child-details.component.html',
  styleUrls: ['./child-details.component.css']
})
export class ChildDetailsComponent {

  child: Child = new Child('');

  form: FormGroup;
  creatingNew = false;
  editing = false;

  gender = Gender;

  transformGendersEnum(): Array<string> {
    const genders = Object.keys(this.gender);
    return genders.slice(0, genders.length / 2);
  }

  initializeForm() {
    this.form = this.fb.group({
      name:         [{value: this.child.name,         disabled: !this.editing}, Validators.required],
      gender:       [{value: this.child.gender,       disabled: !this.editing}],
      project:      [{value: this.child.pn,           disabled: !this.editing}],
      birthday:     [{value: this.child.dateOfBirth,  disabled: !this.editing}],
      motherTongue: [{value: this.child.motherTongue, disabled: !this.editing}],
      admission:    [{value: this.child.admission,    disabled: !this.editing}],
      religion:     [{value: this.child.religion,     disabled: !this.editing}]
    });
  }


  constructor(private entityMapperService: EntityMapperService,
              private route: ActivatedRoute,
              @Inject(FormBuilder) public fb: FormBuilder,
              private router: Router,
              private snackBar: MatSnackBar,
              private confirmationDialog: ConfirmationDialogService,
              private alertService: AlertService) {

    const id = this.route.snapshot.params['id'];
    if (id === 'new') {
      this.creatingNew = true;
      this.editing = true;
      this.child = new Child(uniqid());
    } else {
      this.entityMapperService.load<Child>(Child, id)
        .then(child => {
          this.child = child;
          this.initializeForm();
        });
    }
    this.initializeForm();
  }

  switchEdit() {
    this.editing = !this.editing;
    this.initializeForm();
  }

  save() {
    this.child.name = this.form.get('name').value;
    this.child.gender = this.form.get('gender').value;
    this.child.religion = this.form.get('religion').value;
    this.child.pn = this.form.get('project').value;
    this.child.dateOfBirth = this.form.get('birthday').value;
    this.child.motherTongue = this.form.get('motherTongue').value;
    this.child.admission = this.form.get('admission').value;

    this.entityMapperService.save<Child>(this.child)
      .then(() => {
        if (this.creatingNew) {
          this.router.navigate(['/child', this.child.getId()]);
        }
        this.switchEdit();
      })
      .catch((err) => this.alertService.addDanger('Could not save Child "' + this.child.name + '": ' + err));
  }

  removeChild() {
    const dialogRef = this.confirmationDialog
      .openDialog('Delete?', 'Are you sure you want to delete this Child?');

    dialogRef.afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.entityMapperService.remove<Child>(this.child)
            .then(() => this.router.navigate(['/child']));

          const snackBarRef = this.snackBar.open('Deleted Child "' + this.child.name + '"', 'Undo', {duration: 8000});
          snackBarRef.onAction().subscribe(() => {
            this.entityMapperService.save(this.child, true);
            this.router.navigate(['/child', this.child.getId()]);
          });
        }
      });
  }
}
