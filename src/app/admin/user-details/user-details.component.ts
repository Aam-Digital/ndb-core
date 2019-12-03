import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User} from '../../user/user';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
  creating: boolean = true;
  private readonly defaultPasswordValue: string = 'password';
  private readonly defaultUsernameValue: string = 'username';

  userForm: FormGroup = this.fb.group({
    username: [{value: this.defaultUsernameValue, disabled: !this.creating}, Validators.required],
    password: [this.defaultPasswordValue, Validators.required],
    admin: [false]
  });

  constructor(
    private dialogRef: MatDialogRef<UserDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User,
    private fb: FormBuilder,
    private entityMapper: EntityMapperService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.creating = this.user === null;
    if (! this.creating) {
      this.userForm.patchValue({username: {value: this.user.name, disabled: !this.creating}});
      this.userForm.patchValue({admin: this.user.isAdmin()});
    }
  }

  initForm() {
    this.fb.group({
      username: [{value: 'Username', disabled: !this.creating}, Validators.required],
      password: [this.defaultPasswordValue, Validators.required],
      admin: [false]
    });
  }

  saveUser() {
    const {username, password, admin} = this.userForm.getRawValue();
    if (this.creating) {
      this.user = new User(username);
    } else if (username !== this.user.name) {
      // Can't be reached because changing username is not allowed
      this.entityMapper.remove<User>(this.user);
      this.user = new User(username);
    }
    this.user.name = username;
    if (password !== this.defaultPasswordValue) {
      this.user.setNewPassword(password);
    }
    this.user.admin = admin;
    this.entityMapper.save<User>(this.user)
      .then(() => this.dialogRef.close(this.user));
  }

  removeUser() {
    this.entityMapper.remove<User>(this.user)
      .then(() => {
        const snackBarRef = this.snackBar.open('Deleted User "' + this.user.name + '"', 'Undo', {duration: 8000});
        snackBarRef.onAction().subscribe(() => {
          this.entityMapper.save(this.user, true);
        });
        this.dialogRef.close(this.user);
      });
    }
}
