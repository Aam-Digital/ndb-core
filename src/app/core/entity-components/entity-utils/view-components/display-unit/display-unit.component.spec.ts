import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayUnitComponent } from './display-unit.component';

describe('DisplayUnitComponent', () => {
  let component: DisplayUnitComponent;
  let fixture: ComponentFixture<DisplayUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayUnitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
