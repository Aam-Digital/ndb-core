import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayMonthComponent } from './display-month.component';

describe('DisplayMonthComponent', () => {
  let component: DisplayMonthComponent;
  let fixture: ComponentFixture<DisplayMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DisplayMonthComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
