import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportAdditionalActionsComponent } from './import-additional-actions.component';

describe('ImportAdditionalActionsComponent', () => {
  let component: ImportAdditionalActionsComponent;
  let fixture: ComponentFixture<ImportAdditionalActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportAdditionalActionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportAdditionalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
