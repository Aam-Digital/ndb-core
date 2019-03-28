import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthCheckupComponent } from './health-checkup.component';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import { EntitySubrecordComponent } from 'app/ui-helper/entity-subrecord/entity-subrecord.component';
import {Child} from '../child';
import { CommonModule, DatePipe } from '@angular/common';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import { MatTableModule, MatSelectModule, MatOptionModule, MatAutocomplete, MatAutocompleteModule, MatFormFieldModule, MatIcon, MatIconModule, MatSnackBar, MatDialog, MatDialogModule } from '@angular/material';
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
    }
  };
  let mockEntityMapper;

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
