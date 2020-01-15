import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsComponent } from './user-details.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../user/user';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { EntitySchemaService } from '../../entity/schema/entity-schema.service';
import { MockDatabase } from '../../database/mock-database';
import { Database } from '../../database/database';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;
  const testUser = new User('username');

  beforeEach(async(() => {
    const dialog = {
      close: () => {},
    };
    testUser.name = 'username';
    testUser.admin = true;
    TestBed.configureTestingModule({
      declarations: [ UserDetailsComponent ],
      imports: [
        MatFormFieldModule,
        MatCheckboxModule,
        ReactiveFormsModule,
        MatTableModule,
        MatSnackBarModule,
        MatInputModule,
        NoopAnimationsModule,
        MatDialogModule,
        ],
      providers: [
        { provide: Database, useClass: MockDatabase},
        EntityMapperService,
        EntitySchemaService,
        {provide: MatDialogRef, useValue: dialog},
        { provide: MAT_DIALOG_DATA, useValue: new User('demo') },
      ],
    })
    .compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    component.user = testUser;
    fixture.detectChanges();
    component.ngOnInit();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls the entity mapper when saving a user', () => {
    const entityMapper = fixture.debugElement.injector.get(EntityMapperService);
    spyOn(entityMapper, 'save').and.callThrough();
    component.saveUser();
    expect(entityMapper.save).toHaveBeenCalledWith(testUser);
  });

  it('closes the dialog after removing the user', async (done) => {
    const dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    const entityMapperService = fixture.debugElement.injector.get(EntityMapperService);
    await entityMapperService.save(testUser);
    spyOn(dialogRef, 'close');
    spyOn(entityMapperService, 'remove').and.callThrough();
    component.removeUser();
    setTimeout(() => {
      expect(entityMapperService.remove).toHaveBeenCalledWith(testUser);
      expect(dialogRef.close).toHaveBeenCalled();
      done();
    });
  });

  it('loads a passed user correctly', () => {
    expect(component.userForm.get('username').value).toBe(testUser.name);
    expect(component.userForm.get('admin').value).toBe(testUser.isAdmin());
  });

  it('saves a newly created user correctly', (done) => {
    const dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    const entityMapperService = fixture.debugElement.injector.get(EntityMapperService);
    spyOn(dialogRef, 'close');
    spyOn(entityMapperService, 'save').and.callThrough();
    const username = 'newUser';
    const password = 'newPassword';
    const newUser = new User(username);
    newUser.admin = false;
    newUser.name = username;
    newUser.setNewPassword(password);
    component.creating = true;
    component.userForm.patchValue({
      admin: newUser.isAdmin(),
      username: newUser.name,
      password: password,
    });
    component.saveUser();
    expect(userEqual(component.user, newUser)).toBeTruthy();
    setTimeout(async () => {
      expect(entityMapperService.save).toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalled();
      const user = await entityMapperService.load<User>(User, newUser.getId());
      expect(userEqual(user, newUser)).toBeTruthy();
      expect(user.checkPassword(password)).toBeTruthy();
      done();
    });
  });
});

function userEqual(actual: User, expected: User): boolean {
  return actual.name === expected.name
    && actual.getId() === expected.getId()
    && actual.isAdmin() === expected.isAdmin();
}
