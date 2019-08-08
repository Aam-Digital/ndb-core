import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { EditSchoolDialogComponent } from './edit-school-dialog.component';
import {FormsModule} from '@angular/forms';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';
import {Child} from '../../child';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Database} from '../../../database/database';
import {EntitySchemaService} from '../../../entity/schema/entity-schema.service';

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
        { provide: Database, useClass: MockDatabase },
        {provide: MatDialogRef, useValue: MatDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: {child: new Child('')}},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSchoolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
