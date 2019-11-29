import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceDetailsComponent } from './attendance-details.component';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AttendanceDaysComponent} from '../attendance-days/attendance-days.component';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {ChildrenService} from '../../children.service';
import {AttendanceMonth} from '../attendance-month';
import {EntityModule} from '../../../entity/entity.module';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AttendanceDayBlockComponent} from '../attendance-days/attendance-day-block.component';
import { SessionService } from 'app/session/session.service';
import { Overlay } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from 'app/alerts/alert.service';
import { DatabaseManagerService } from 'app/database/database-manager.service';
import { BlobService } from 'app/webdav/blob-service.service';
import { MockBlobService } from 'app/webdav/mock-blob-service';

describe('AttendanceDetailsComponent', () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(async(() => {
    const att = new AttendanceMonth('test');
    att.month = new Date();

    TestBed.configureTestingModule({
      declarations: [ AttendanceDetailsComponent, AttendanceDayBlockComponent, AttendanceDaysComponent,
        ChildBlockComponent, SchoolBlockComponent ],
      imports: [ MatFormFieldModule, MatInputModule, MatDialogModule, MatSelectModule, MatIconModule, MatTooltipModule,
        FormsModule, CommonModule, RouterTestingModule, NoopAnimationsModule,
        UiHelperModule, EntityModule],
      providers: [
        {provide: Database, useClass: MockDatabase},
        {provide: MatDialogRef, useValue: {beforeClose: () => { return { subscribe: () => {}}; }}},
        {provide: MAT_DIALOG_DATA, useValue: {entity: att}},
        {provide: ChildrenService, useClass: ChildrenService},
        {provide: BlobService, useClass: MockBlobService}
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
