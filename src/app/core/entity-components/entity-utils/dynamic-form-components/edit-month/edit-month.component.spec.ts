import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMonthComponent } from './edit-month.component';

describe('EditMonthComponent', () => {
  let component: EditMonthComponent;
  let fixture: ComponentFixture<EditMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ EditMonthComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
