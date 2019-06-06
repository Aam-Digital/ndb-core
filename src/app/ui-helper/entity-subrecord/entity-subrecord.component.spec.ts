import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitySubrecordComponent } from './entity-subrecord.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {ConfirmationDialogService} from '../confirmation-dialog/confirmation-dialog.service';
import { CommonModule } from '@angular/common';

describe('EntitySubrecordComponent', () => {
  let component: EntitySubrecordComponent;
  let fixture: ComponentFixture<EntitySubrecordComponent>;

  let mockEntityMapper;

  beforeEach(async(() => {
    mockEntityMapper = new EntityMapperService(new MockDatabase());

    TestBed.configureTestingModule({
      declarations: [ EntitySubrecordComponent ],
      imports: [MatTableModule, MatFormFieldModule, MatIconModule,
        MatSnackBarModule, MatSelectModule, MatDialogModule, MatAutocompleteModule, CommonModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ConfirmationDialogService, useClass: ConfirmationDialogService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySubrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
