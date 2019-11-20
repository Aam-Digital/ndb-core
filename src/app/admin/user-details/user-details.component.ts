import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User} from '../../user/user';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
  creating: boolean = false;

  userForm: FormGroup = this.fb.group({
    username: ['Username', Validators.required],
    password: ['password', Validators.required],
    admin: [false]
  });

  constructor(
    private dialogRef: MatDialogRef<UserDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User,
    private fb: FormBuilder,
    private entityMapper: EntityMapperService
  ) { }

  ngOnInit() {
    this.creating = this.user === null;
    console.log('user', this.user);
    if (! this.creating) {
      this.userForm.patchValue({username: this.user.name});
      this.userForm.patchValue({admin: this.user.isAdmin()});
    }
  }

  saveUser() {
    const {username, password, admin} = this.userForm.getRawValue();
    if (this.creating) {
      this.user = new User(username);
    } else if (username !== this.user.name) {
      this.entityMapper.remove<User>(this.user);
      this.user = new User(username);
    }
    this.user.name = username;
    console.log('data', this.userForm.getRawValue());
    this.user.setNewPassword(password);
    this.user.admin = admin;
    console.log('user', this.user);
    this.entityMapper.save<User>(this.user)
      .then(() => this.dialogRef.close(this.user));
  }

  removeUser() {
    this.entityMapper.remove<User>(this.user)
      .then(() => this.dialogRef.close(this.user));
  }

}
