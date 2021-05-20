import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSingleEntityComponent } from './edit-single-entity.component';

describe('EditSingleEntityComponent', () => {
  let component: EditSingleEntityComponent;
  let fixture: ComponentFixture<EditSingleEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSingleEntityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSingleEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
