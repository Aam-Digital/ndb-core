import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsComponent } from './user-details.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {ReactiveFormsModule} from '@angular/forms';
import {MatTableModule} from '@angular/material/table';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User} from '../../user/user';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {MockDatabase} from '../../database/mock-database';
import {Database} from '../../database/database';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserDetailsComponent ],
      imports: [
        MatFormFieldModule,
        MatCheckboxModule,
        ReactiveFormsModule,
        MatTableModule,
        MatSnackBarModule,
        MatInputModule,
        NoopAnimationsModule
        ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useValue: MockDatabase},
        { provide: MatDialogRef, useValue: MatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: new User('demo') },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls the entity mapper when saving a user', () => {
    const entityMapper = fixture.debugElement.injector.get(EntityMapperService);
    spyOn(entityMapper, 'save').and.callThrough();
    component.saveUser();
    expect(entityMapper.save).toHaveBeenCalled();
  });

  it('closes the dialog after removing the user', (done) => {
    const dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    spyOn(dialogRef, 'close');
    component.removeUser();
    setTimeout(() => {
      expect(dialogRef.close).toHaveBeenCalled();
      done();
    });
  });
});
