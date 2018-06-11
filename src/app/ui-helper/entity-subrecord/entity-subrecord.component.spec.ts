import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitySubrecordComponent } from './entity-subrecord.component';
import {
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTableModule
} from '@angular/material';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {ConfirmationDialogService} from '../confirmation-dialog/confirmation-dialog.service';

describe('EntitySubrecordComponent', () => {
  let component: EntitySubrecordComponent;
  let fixture: ComponentFixture<EntitySubrecordComponent>;

  let mockEntityMapper;

  beforeEach(async(() => {
    mockEntityMapper = new EntityMapperService(new MockDatabase());

    TestBed.configureTestingModule({
      declarations: [ EntitySubrecordComponent ],
      imports: [MatTableModule, MatFormFieldModule, MatIconModule, MatSnackBarModule, MatSelectModule, MatDialogModule],
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
