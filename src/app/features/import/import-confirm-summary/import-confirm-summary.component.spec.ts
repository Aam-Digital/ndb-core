import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportConfirmSummaryComponent } from './import-confirm-summary.component';

describe('ImportConfirmSummaryComponent', () => {
  let component: ImportConfirmSummaryComponent;
  let fixture: ComponentFixture<ImportConfirmSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportConfirmSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportConfirmSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
