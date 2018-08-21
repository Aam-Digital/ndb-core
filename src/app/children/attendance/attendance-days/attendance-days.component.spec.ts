import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceDaysComponent } from './attendance-days.component';

describe('AttendanceDaysComponent', () => {
  let component: AttendanceDaysComponent;
  let fixture: ComponentFixture<AttendanceDaysComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendanceDaysComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
