import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayPercentageComponent } from './display-percentage.component';

describe('DisplayPercentageComponent', () => {
  let component: DisplayPercentageComponent;
  let fixture: ComponentFixture<DisplayPercentageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayPercentageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayPercentageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
