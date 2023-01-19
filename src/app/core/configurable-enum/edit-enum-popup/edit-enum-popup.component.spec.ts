import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditEnumPopupComponent } from './edit-enum-popup.component';

describe('EditEnumPopupComponent', () => {
  let component: EditEnumPopupComponent;
  let fixture: ComponentFixture<EditEnumPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditEnumPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditEnumPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
