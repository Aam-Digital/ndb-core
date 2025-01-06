import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPrefilledValuesComponent } from './edit-prefilled-values.component';

describe('EditPrefilledValuesComponent', () => {
  let component: EditPrefilledValuesComponent;
  let fixture: ComponentFixture<EditPrefilledValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPrefilledValuesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPrefilledValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
