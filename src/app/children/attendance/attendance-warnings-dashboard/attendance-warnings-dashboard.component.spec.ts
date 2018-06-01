import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceWarningsDashboardComponent } from './attendance-warnings-dashboard.component';

describe('AttendanceWarningsDashboardComponent', () => {
  let component: AttendanceWarningsDashboardComponent;
  let fixture: ComponentFixture<AttendanceWarningsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendanceWarningsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceWarningsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
