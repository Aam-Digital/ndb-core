import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMonthAttendanceComponent } from './add-month-attendance.component';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {FormsModule} from '@angular/forms';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';
import {Database} from '../../../database/database';
import {ChildrenService} from '../../children.service';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {AlertsModule} from '../../../alerts/alerts.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {EntitySchemaService} from '../../../entity/schema/entity-schema.service';

describe('AddMonthAttendanceComponent', () => {
  let component: AddMonthAttendanceComponent;
  let fixture: ComponentFixture<AddMonthAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMonthAttendanceComponent, SchoolBlockComponent, ChildBlockComponent ],
      imports: [
        MatButtonToggleModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatCheckboxModule,
        MatInputModule,
        MatTableModule,
        MatButtonModule,
        MatProgressBarModule,
        FormsModule,
        UiHelperModule,
        AlertsModule,
        NoopAnimationsModule,
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        ChildrenService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMonthAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
