import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportSelectFileComponent } from './import-select-file.component';

describe('ImportSelectFileComponent', () => {
  let component: ImportSelectFileComponent;
  let fixture: ComponentFixture<ImportSelectFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportSelectFileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportSelectFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
