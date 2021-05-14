import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSelectableComponent } from './edit-selectable.component';

describe('EditSelectableComponent', () => {
  let component: EditSelectableComponent;
  let fixture: ComponentFixture<EditSelectableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSelectableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSelectableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
