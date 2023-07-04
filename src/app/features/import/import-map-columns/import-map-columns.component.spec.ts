import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportMapColumnsComponent } from './import-map-columns.component';

describe('ImportMapColumnsComponent', () => {
  let component: ImportMapColumnsComponent;
  let fixture: ComponentFixture<ImportMapColumnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportMapColumnsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportMapColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
