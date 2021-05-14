import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBooleanComponent } from './edit-boolean.component';

describe('EditBooleanComponent', () => {
  let component: EditBooleanComponent;
  let fixture: ComponentFixture<EditBooleanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditBooleanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditBooleanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
