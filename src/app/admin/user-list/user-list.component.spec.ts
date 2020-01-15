import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListComponent } from './user-list.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {MockDatabase} from '../../database/mock-database';
import {Database} from '../../database/database';
import {MatDialog} from '@angular/material/dialog';
import {AdminModule} from '../admin.module';
import {of} from 'rxjs';
import {User} from '../../user/user';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AdminModule
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens dialog when create is clicked', () => {
    const dialogService = fixture.debugElement.injector.get(MatDialog);
    spyOn(dialogService, 'open').and.callThrough();
    component.createUser();
    expect(dialogService.open).toHaveBeenCalled();
  });

  it('loads new data when dialog returns value', () => {
    const dialogService = fixture.debugElement.injector.get(MatDialog);
    const mockedDialogRef = {afterClosed: () => of(new User('test'))};
    // @ts-ignore
    spyOn(dialogService, 'open').and.returnValue(mockedDialogRef);
    spyOn(component, 'loadData');
    component.createUser();
    expect(component.loadData).toHaveBeenCalled();
  });
});
