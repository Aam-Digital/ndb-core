import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAgeComponent } from './edit-age.component';

describe('EditAgeComponent', () => {
  let component: EditAgeComponent;
  let fixture: ComponentFixture<EditAgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditAgeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
