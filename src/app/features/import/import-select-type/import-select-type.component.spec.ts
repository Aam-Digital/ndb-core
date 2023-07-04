import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportSelectTypeComponent } from './import-select-type.component';

describe('ImportSelectTypeComponent', () => {
  let component: ImportSelectTypeComponent;
  let fixture: ComponentFixture<ImportSelectTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportSelectTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportSelectTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
