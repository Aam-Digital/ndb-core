import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSelectableEntityComponent } from './edit-selectable-entity.component';

describe('EditSelectableEntityComponent', () => {
  let component: EditSelectableEntityComponent;
  let fixture: ComponentFixture<EditSelectableEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSelectableEntityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSelectableEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
