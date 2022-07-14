import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTextWithAutocompleteComponent } from './edit-text-with-autocomplete.component';

describe('EditTextWithAutocompleteComponent', () => {
  let component: EditTextWithAutocompleteComponent;
  let fixture: ComponentFixture<EditTextWithAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTextWithAutocompleteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTextWithAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
