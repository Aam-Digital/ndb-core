import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayRecurringIntervalComponent } from './display-recurring-interval.component';

describe('DisplayRecurringIntervalComponent', () => {
  let component: DisplayRecurringIntervalComponent;
  let fixture: ComponentFixture<DisplayRecurringIntervalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayRecurringIntervalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayRecurringIntervalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
