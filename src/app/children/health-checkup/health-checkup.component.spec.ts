import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthCheckupComponent } from './health-checkup.component';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import { EntitySubrecordComponent } from 'app/ui-helper/entity-subrecord/entity-subrecord.component';
import {Child} from '../child';
import { CommonModule, DatePipe } from '@angular/common';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDialogService } from 'app/ui-helper/confirmation-dialog/confirmation-dialog.service';

describe('HealthCheckupComponent', () => {
  let component: HealthCheckupComponent;
  let fixture: ComponentFixture<HealthCheckupComponent>;

  const mockChildrenService = {
    getChild: (id) => {
      return of([new Child('22')]);
    },
    getEducationalMaterialsOfChild: (id) => {
      return of([]);
    },
    getHealthChecksOfChild: (id) => {
      return of([]);
    }
  };
  const mockEntityMapper = jasmine.createSpyObj('mockEntityMapper', ['save', 'remove']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthCheckupComponent, EntitySubrecordComponent],
      imports: [CommonModule, MatTableModule, MatSelectModule, MatOptionModule, MatAutocompleteModule, MatFormFieldModule,
      MatIconModule, NoopAnimationsModule, MatDialogModule],
      providers: [
        DatePipe,
        MatSnackBar,
        ConfirmationDialogService,
        MatDialog,
       { provide: ActivatedRoute, useValue: {paramMap: of({get: () => '22'}) } },
       { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthCheckupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
