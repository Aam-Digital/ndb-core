import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberRangeFilterComponent } from './number-range-filter.component';

describe('NumberRangeFilterComponent', () => {
  let component: NumberRangeFilterComponent;
  let fixture: ComponentFixture<NumberRangeFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberRangeFilterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NumberRangeFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
