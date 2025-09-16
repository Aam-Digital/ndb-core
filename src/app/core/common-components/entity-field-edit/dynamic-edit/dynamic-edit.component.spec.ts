import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentRegistry } from '#src/app/dynamic-components';
import { DynamicEditComponent } from './dynamic-edit.component';

describe('DynamicEditComponent', () => {
  let component: DynamicEditComponent;
  let fixture: ComponentFixture<DynamicEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicEditComponent],
      providers: [ComponentRegistry],
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicEditComponent);
    component = fixture.componentInstance;

    component.formFieldConfig = {
      id: 'testField',
    }

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
