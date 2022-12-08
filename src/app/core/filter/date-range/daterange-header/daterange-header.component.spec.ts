import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaterangeHeaderComponent } from './daterange-header.component';

describe('DaterangeHeaderComponent', () => {
  let component: DaterangeHeaderComponent;
  let fixture: ComponentFixture<DaterangeHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DaterangeHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaterangeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
