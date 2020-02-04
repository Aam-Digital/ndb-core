import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { EditSchoolDialogComponent } from './edit-school-dialog.component';
import { FormsModule } from '@angular/forms';
import { EntityMapperService } from '../../../../core/entity/entity-mapper.service';
import { MockDatabase } from '../../../../core/database/mock-database';
import { Child } from '../../model/child';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Database } from '../../../../core/database/database';
import { EntitySchemaService } from '../../../../core/entity/schema/entity-schema.service';
import { ConfirmationDialogService } from '../../../../core/ui-helper/confirmation-dialog/confirmation-dialog.service';
import { ChildSchoolRelation } from '../../model/childSchoolRelation';
import { of } from 'rxjs';

const mockedDialogRef = {
  beforeClosed() {return of(new ChildSchoolRelation('')); },
  close(r: any) {},
};
const mockedData = {
  entity: new ChildSchoolRelation('1'),
  child: new Child(''),
  creating: undefined,
};

describe('EditSchoolDialogComponent', () => {
  let component: EditSchoolDialogComponent;
  let fixture: ComponentFixture<EditSchoolDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditSchoolDialogComponent ],
      imports: [
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        FormsModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        ConfirmationDialogService,
        {provide: Database, useClass: MockDatabase },
        {provide: MatDialogRef, useValue: mockedDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: mockedData},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSchoolDialogComponent);
    component = fixture.componentInstance;
    fixture.debugElement.injector.get(EntityMapperService).save(mockedData.entity);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial data', function () {
    expect(component.entity).toBe(mockedData.entity);
  });

  it('should delete data', async function () {
    const entityMapper = fixture.debugElement.injector.get(EntityMapperService);
    // First try, we want to find the entity here
    await entityMapper.load(ChildSchoolRelation, '1')
      // Object found, as expected
      .then((res) => expect(true).toBe(true))
      // Object not found, throw an error
      .catch(() => expect(true).toBe(false));
    component.delete();
    // Second try, we have deleted the entity and do not want to find it
    await entityMapper.load(ChildSchoolRelation, '1')
      // Object found, throw an error
      .then((res) => expect(true).toBe(false))
      // Object not found, EntityMapper throws an error, object got deleted properly
      .catch(() => expect(true).toBe(true));
  });
});
