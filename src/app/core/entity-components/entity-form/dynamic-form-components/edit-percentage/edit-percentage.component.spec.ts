import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPercentageComponent } from './edit-percentage.component';

describe('EditPercentageComponent', () => {
  let component: EditPercentageComponent;
  let fixture: ComponentFixture<EditPercentageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditPercentageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPercentageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
