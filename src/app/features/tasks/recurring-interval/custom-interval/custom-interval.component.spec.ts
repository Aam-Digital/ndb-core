import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomIntervalComponent } from './custom-interval.component';

describe('CustomIntervalComponent', () => {
  let component: CustomIntervalComponent;
  let fixture: ComponentFixture<CustomIntervalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomIntervalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomIntervalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
